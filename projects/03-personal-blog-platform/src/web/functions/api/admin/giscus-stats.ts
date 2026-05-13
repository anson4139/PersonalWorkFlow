import type { EventContext } from "@cloudflare/workers-types";
import type { Env } from "../../_types";
import { json, requireAdmin } from "./_auth";

// Giscus 設定（與前端 GiscusComments.tsx 一致）
const REPO_OWNER = "anson4139";
const REPO_NAME = "PersonalWorkFlow";
const CATEGORY_NAME = "Blog Comments";

// GET /api/admin/giscus-stats
// 透過 GitHub GraphQL API 查詢 Blog Comments 分類的留言數
export async function onRequest(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { request, env } = ctx;
  const deny = await requireAdmin(request, env);
  if (deny) return deny;
  if (request.method !== "GET")
    return json({ error: "Method Not Allowed" }, 405);

  if (!env.GITHUB_PAT) {
    return json(
      {
        total_discussions: 0,
        total_comments: 0,
        error: "GITHUB_PAT not configured",
      },
      200,
    );
  }

  // 先查 category id，再查該 category 的 discussions
  const graphqlQuery = `
    query {
      repository(owner: "${REPO_OWNER}", name: "${REPO_NAME}") {
        discussions(first: 1) {
          totalCount
        }
        discussionCategories(first: 20) {
          nodes {
            name
            id
          }
        }
      }
    }
  `;

  try {
    const catRes = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_PAT}`,
        "Content-Type": "application/json",
        "User-Agent": "personal-blog-platform",
      },
      body: JSON.stringify({ query: graphqlQuery }),
    });

    if (!catRes.ok) {
      return json(
        { total_discussions: 0, total_comments: 0, error: "GitHub API error" },
        200,
      );
    }

    const catData = (await catRes.json()) as {
      data?: {
        repository?: {
          discussionCategories?: { nodes: { name: string; id: string }[] };
          discussions?: { totalCount: number };
        };
      };
      errors?: { message: string }[];
    };

    if (catData.errors?.length) {
      return json(
        {
          total_discussions: 0,
          total_comments: 0,
          error: catData.errors[0].message,
        },
        200,
      );
    }

    const categories =
      catData.data?.repository?.discussionCategories?.nodes ?? [];
    const blogCategory = categories.find((c) => c.name === CATEGORY_NAME);

    if (!blogCategory) {
      return json({ total_discussions: 0, total_comments: 0 }, 200);
    }

    // 查 Blog Comments 分類的所有討論 + 留言數
    const discQuery = `
      query {
        repository(owner: "${REPO_OWNER}", name: "${REPO_NAME}") {
          discussions(first: 100, categoryId: "${blogCategory.id}") {
            totalCount
            nodes {
              comments {
                totalCount
              }
            }
          }
        }
      }
    `;

    const discRes = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_PAT}`,
        "Content-Type": "application/json",
        "User-Agent": "personal-blog-platform",
      },
      body: JSON.stringify({ query: discQuery }),
    });

    const discData = (await discRes.json()) as {
      data?: {
        repository?: {
          discussions?: {
            totalCount: number;
            nodes: { comments: { totalCount: number } }[];
          };
        };
      };
    };

    const discussions = discData.data?.repository?.discussions;
    const totalDiscussions = discussions?.totalCount ?? 0;
    const totalComments = (discussions?.nodes ?? []).reduce(
      (sum, d) => sum + d.comments.totalCount,
      0,
    );

    return json({
      total_discussions: totalDiscussions,
      total_comments: totalComments,
    });
  } catch (e) {
    return json(
      { total_discussions: 0, total_comments: 0, error: String(e) },
      200,
    );
  }
}
