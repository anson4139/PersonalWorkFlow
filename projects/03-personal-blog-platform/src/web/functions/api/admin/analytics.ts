import type { Env } from "../../_types";
import { json, requireAdmin } from "./_auth";

interface DailyLogin {
  date: string;
  count: number;
}
interface ActionCount {
  action: string;
  count: number;
}
interface TopUser {
  email: string;
  role: string;
  last_login: string | null;
  login_count: number;
}

// GET /api/admin/analytics
// Returns: { daily_logins, action_counts, top_users }
// Scope: admin only, last 90 days
export async function onRequest(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { request, env } = ctx;
  const deny = await requireAdmin(request, env);
  if (deny) return deny;
  if (request.method !== "GET")
    return json({ error: "Method Not Allowed" }, 405);

  const [dailyResult, actionResult, topUsersResult] = await env.BLOG_DB.batch([
    env.BLOG_DB.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM user_events
      WHERE action = 'login'
        AND created_at >= datetime('now', '-90 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `),
    env.BLOG_DB.prepare(`
      SELECT action, COUNT(*) as count
      FROM user_events
      WHERE created_at >= datetime('now', '-90 days')
      GROUP BY action
      ORDER BY count DESC
    `),
    env.BLOG_DB.prepare(`
      SELECT email, role, last_login, login_count
      FROM user_sessions
      ORDER BY last_login DESC
      LIMIT 20
    `),
  ]);

  return json({
    daily_logins: dailyResult.results as DailyLogin[],
    action_counts: actionResult.results as ActionCount[],
    top_users: topUsersResult.results as TopUser[],
  });
}
