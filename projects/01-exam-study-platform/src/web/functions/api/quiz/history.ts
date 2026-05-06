import { getAccessIdentity } from "../../_shared/access";

interface Env {
  ANSON_EMAIL?: string;
  TEAM_DOMAIN?: string;
  ACCESS_DB?: D1Database;
  VITE_DEV_VIEWER_EMAIL?: string;
}

interface SessionRow {
  id: number;
  subject_key: string;
  session_label: string;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  score: number | null;
  status: string;
  started_at: string;
  ended_at: string | null;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
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

  const userRow = await db
    .prepare("SELECT id, total_points FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: number; total_points: number }>();

  if (!userRow) {
    return Response.json({ sessions: [], totalPoints: 0 });
  }

  const sessions = await db
    .prepare(
      `SELECT
         id, subject_key, session_label, total_questions,
         correct_count, wrong_count, score, status, started_at, ended_at
       FROM quiz_sessions
       WHERE user_id = ?
       ORDER BY started_at DESC
       LIMIT 10`,
    )
    .bind(userRow.id)
    .all<SessionRow>();

  return Response.json({
    sessions: sessions.results,
    totalPoints: userRow.total_points,
  });
};
