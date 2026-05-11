import type { EventContext } from "@cloudflare/workers-types";
import type { Env } from "../../_types";
import { json, requireAdmin } from "./_auth";

const REPO_OWNER = "anson4139";
const REPO_NAME = "PersonalWorkFlow";
const CATEGORY_ID = "DIC_kwDOSNieF84C8wgb";

// GET /api/admin/discussions
// 查詢 Blog Comments 分類下所有 Discussion + 留言（最多 50 篇討論，每篇最多 100 則留言）
export async function onRequest(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { request, env } = ctx;
  const deny = await requireAdmin(request, env);
  if (deny) return deny;
  if (request.method !== "GET")
    return json({ error: "Method Not Allowed" }, 405);

  if (!env.GITHUB_PAT) {
    return json({ error: "GITHUB_PAT not configured", discussions: [] }, 200);
  }

  const graphqlQuery = `
    query {
      repository(owner: "${REPO_OWNER}", name: "${REPO_NAME}") {
        discussions(first: 50, categoryId: "${CATEGORY_ID}", orderBy: { field: UPDATED_AT, direction: DESC }) {
          totalCount
          nodes {
            id
            title
            url
            createdAt
            updatedAt
            comments(first: 100) {
              totalCount
              nodes {
                id
                body
                createdAt
                author {
                  login
                  avatarUrl
                }
                replies(first: 20) {
                  nodes {
                    id
                    body
                    createdAt
                    author {
                      login
                      avatarUrl
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_PAT}`,
        "Content-Type": "application/json",
        "User-Agent": "personal-blog-platform",
      },
      body: JSON.stringify({ query: graphqlQuery }),
    });

    if (!res.ok) {
      return json(
        { error: `GitHub API error: ${res.status}`, discussions: [] },
        200,
      );
    }

    const data = (await res.json()) as {
      data?: {
        repository?: {
          discussions?: {
            totalCount: number;
            nodes: {
              id: string;
              title: string;
              url: string;
              createdAt: string;
              updatedAt: string;
              comments: {
                totalCount: number;
                nodes: {
                  id: string;
                  body: string;
                  createdAt: string;
                  author: { login: string; avatarUrl: string } | null;
                  replies: {
                    nodes: {
                      id: string;
                      body: string;
                      createdAt: string;
                      author: { login: string; avatarUrl: string } | null;
                    }[];
                  };
                }[];
              };
            }[];
          };
        };
      };
      errors?: { message: string }[];
    };

    if (data.errors?.length) {
      return json({ error: data.errors[0].message, discussions: [] }, 200);
    }

    const discussions = data.data?.repository?.discussions?.nodes ?? [];
    const total = data.data?.repository?.discussions?.totalCount ?? 0;

    // 從 Discussion title（= giscus pathname，如 "posts/ai-mp04amon"）提取 slug
    // 再到 D1 補查文章標題，回傳 postTitles map
    const slugs = discussions
      .map((d) => {
        const m = d.title.match(/^posts\/(.+)$/);
        return m ? m[1] : null;
      })
      .filter((s): s is string => s !== null);

    let postTitles: Record<string, string> = {};
    if (slugs.length > 0) {
      try {
        const placeholders = slugs.map(() => "?").join(", ");
        const rows = await env.BLOG_DB.prepare(
          `SELECT slug, title FROM posts WHERE slug IN (${placeholders})`,
        )
          .bind(...slugs)
          .all<{ slug: string; title: string }>();
        if (rows.results) {
          for (const row of rows.results) {
            postTitles[`posts/${row.slug}`] = row.title;
          }
        }
      } catch {
        // D1 查詢失敗不阻礙主要結果
      }
    }

    return json({ total, discussions, postTitles }, 200);
  } catch (e) {
    return json({ error: String(e), discussions: [] }, 500);
  }
}
