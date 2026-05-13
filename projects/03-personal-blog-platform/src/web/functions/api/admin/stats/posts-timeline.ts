import type { EventContext } from "@cloudflare/workers-types";
import type { Env } from "../../../_types";
import { json, requireAdmin } from "../_auth";

// GET /api/admin/stats/posts-timeline — published posts grouped by day, last 90 days
export async function onRequest(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { request, env } = ctx;
  const deny = await requireAdmin(request, env);
  if (deny) return deny;
  if (request.method !== "GET")
    return json({ error: "Method Not Allowed" }, 405);

  const result = await env.BLOG_DB.prepare(
    `SELECT date(published_at) AS date, COUNT(*) AS count
       FROM posts
      WHERE status = 'published'
        AND published_at IS NOT NULL
        AND date(published_at) >= date('now', '-90 day')
      GROUP BY date(published_at)
      ORDER BY date(published_at) ASC`,
  ).all<{ date: string; count: number }>();

  return json({ timeline: result.results ?? [] }, 200);
}
