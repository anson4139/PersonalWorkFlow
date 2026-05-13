import type { EventContext } from "@cloudflare/workers-types";
import type { Env } from "../../_types";
import { json, requireAdmin } from "./_auth";

const REPO_OWNER = "anson4139";
const REPO_NAME = "PersonalWorkFlow";
const CATEGORY_ID = "DIC_kwDOSNieF84C8wgb";

type TimelinePoint = { date: string; count: number };

function dateKey(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

// GET /api/admin/giscus-timeline — Giscus discussion comments grouped by day, last 90 days
export async function onRequest(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { request, env } = ctx;
  const deny = await requireAdmin(request, env);
  if (deny) return deny;
  if (request.method !== "GET")
    return json({ error: "Method Not Allowed" }, 405);

  if (!env.GITHUB_PAT) {
    return json({ timeline: [], error: "GITHUB_PAT not configured" }, 200);
  }

  const since = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const graphqlQuery = `
    query {
      repository(owner: "${REPO_OWNER}", name: "${REPO_NAME}") {
        discussions(first: 50, categoryId: "${CATEGORY_ID}", orderBy: { field: UPDATED_AT, direction: DESC }) {
          nodes {
            comments(first: 100) {
              nodes {
                createdAt
                replies(first: 20) {
                  nodes {
                    createdAt
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
        { timeline: [], error: `GitHub API error: ${res.status}` },
        200,
      );
    }

    const data = (await res.json()) as {
      data?: {
        repository?: {
          discussions?: {
            nodes: {
              comments: {
                nodes: {
                  createdAt: string;
                  replies: { nodes: { createdAt: string }[] };
                }[];
              };
            }[];
          };
        };
      };
      errors?: { message: string }[];
    };

    if (data.errors?.length) {
      return json({ timeline: [], error: data.errors[0].message }, 200);
    }

    const counts = new Map<string, number>();
    const discussions = data.data?.repository?.discussions?.nodes ?? [];
    for (const discussion of discussions) {
      for (const comment of discussion.comments.nodes) {
        for (const createdAt of [
          comment.createdAt,
          ...comment.replies.nodes.map((reply) => reply.createdAt),
        ]) {
          const timestamp = new Date(createdAt).getTime();
          if (Number.isNaN(timestamp) || timestamp < since) continue;
          const key = dateKey(createdAt);
          if (!key) continue;
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
    }

    const timeline: TimelinePoint[] = Array.from(counts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return json({ timeline }, 200);
  } catch (e) {
    return json({ timeline: [], error: String(e) }, 200);
  }
}
