import type { EventContext } from "@cloudflare/workers-types";
import type { Env } from "../../_types";
import { json, requireAdmin } from "./_auth";

// GET /api/admin/stats — Dashboard 統計
export async function onRequest(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { request, env } = ctx;
  const deny = await requireAdmin(request, env);
  if (deny) return deny;
  if (request.method !== "GET")
    return json({ error: "Method Not Allowed" }, 405);

  const [postStats, categoryCount, tagCount, aiCount] = await env.BLOG_DB.batch(
    [
      env.BLOG_DB.prepare(
        `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as draft
       FROM posts`,
      ),
      env.BLOG_DB.prepare(`SELECT COUNT(*) as n FROM categories`),
      env.BLOG_DB.prepare(`SELECT COUNT(*) as n FROM tags`),
      env.BLOG_DB.prepare(
        `SELECT COUNT(*) as n FROM posts WHERE is_ai_generated = 1`,
      ),
    ],
  );

  const p = postStats.results[0] as {
    total: number;
    published: number;
    draft: number;
  };
  return json({
    posts: {
      total: p?.total ?? 0,
      published: p?.published ?? 0,
      draft: p?.draft ?? 0,
    },
    categories: (categoryCount.results[0] as { n: number })?.n ?? 0,
    tags: (tagCount.results[0] as { n: number })?.n ?? 0,
    ai_generated: (aiCount.results[0] as { n: number })?.n ?? 0,
  });
}
