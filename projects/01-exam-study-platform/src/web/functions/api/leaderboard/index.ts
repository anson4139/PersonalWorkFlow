interface Env {
  ANSON_EMAIL?: string;
  TEAM_DOMAIN?: string;
  ACCESS_DB?: D1Database;
  VITE_DEV_VIEWER_EMAIL?: string;
}

/** GET /api/leaderboard?subject=<key>&limit=10 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.ACCESS_DB;
  if (!db) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  const url = new URL(context.request.url);
  const subject = url.searchParams.get("subject")?.trim() ?? null;
  const rawLimit = parseInt(url.searchParams.get("limit") ?? "10", 10);
  const limit =
    Number.isNaN(rawLimit) || rawLimit < 1 || rawLimit > 50 ? 10 : rawLimit;

  // Build query: optional subject filter
  const rows = subject
    ? await db
        .prepare(
          `SELECT email, display_name, subject_key, score, monsters_defeated, submitted_at
           FROM leaderboard
           WHERE subject_key = ?
           ORDER BY score DESC, monsters_defeated DESC, submitted_at ASC
           LIMIT ?`,
        )
        .bind(subject, limit)
        .all()
    : await db
        .prepare(
          `SELECT email, display_name, subject_key, score, monsters_defeated, submitted_at
           FROM leaderboard
           ORDER BY score DESC, monsters_defeated DESC, submitted_at ASC
           LIMIT ?`,
        )
        .bind(limit)
        .all();

  return Response.json({ entries: rows.results ?? [] });
};
