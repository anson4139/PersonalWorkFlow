import { getAccessIdentity } from "../../_shared/access";

interface Env {
  ANSON_EMAIL?: string;
  TEAM_DOMAIN?: string;
  ACCESS_DB?: D1Database;
  VITE_DEV_VIEWER_EMAIL?: string;
}

interface SubmitRequest {
  subjectKey: string;
  score: number;
  monstersDefeated: number;
  displayName?: string;
}

/** POST /api/leaderboard/submit
 *  Upserts daily-best record for (email, subject_key).
 *  Only updates if the new score is strictly better than the existing one.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const identity = await getAccessIdentity(context.request, context.env);
  const email =
    identity.email ??
    context.env.VITE_DEV_VIEWER_EMAIL?.trim().toLowerCase() ??
    null;

  if (!email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = context.env.ACCESS_DB;
  if (!db) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  let body: SubmitRequest;
  try {
    body = (await context.request.json()) as SubmitRequest;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { subjectKey, score, monstersDefeated, displayName } = body;
  if (
    !subjectKey ||
    typeof score !== "number" ||
    typeof monstersDefeated !== "number"
  ) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (
    score < 0 ||
    score > 100_000 ||
    monstersDefeated < 0 ||
    monstersDefeated > 25
  ) {
    return Response.json({ error: "Invalid score range" }, { status: 400 });
  }

  // Check today's existing record (if any)
  const existing = await db
    .prepare(
      `SELECT id, score FROM leaderboard
       WHERE email = ? AND subject_key = ? AND date(submitted_at) = date('now')`,
    )
    .bind(email, subjectKey)
    .first<{ id: number; score: number }>();

  if (existing && existing.score >= score) {
    // Existing score is equal or better — no update needed
    return Response.json({
      updated: false,
      reason: "existing_score_is_better",
    });
  }

  const name = displayName?.trim().slice(0, 32) ?? null;

  if (existing) {
    // Update in place
    await db
      .prepare(
        `UPDATE leaderboard
         SET score = ?, monsters_defeated = ?, display_name = ?, submitted_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(score, monstersDefeated, name, existing.id)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO leaderboard (email, display_name, subject_key, score, monsters_defeated)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(email, name, subjectKey, score, monstersDefeated)
      .run();
  }

  return Response.json({ updated: true });
};
