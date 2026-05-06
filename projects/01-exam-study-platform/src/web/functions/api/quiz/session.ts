import { getAccessIdentity } from "../../_shared/access";

interface Env {
  ANSON_EMAIL?: string;
  TEAM_DOMAIN?: string;
  ACCESS_DB?: D1Database;
  VITE_DEV_VIEWER_EMAIL?: string;
}

interface SessionRequest {
  subjectKey: string;
  sessionLabel: string;
  totalQuestions: number;
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const identity = await getAccessIdentity(context.request, context.env);
  const email =
    identity.email ??
    context.env.VITE_DEV_VIEWER_EMAIL?.trim().toLowerCase() ??
    null;

  if (!email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SessionRequest;
  try {
    body = (await context.request.json()) as SessionRequest;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { subjectKey, sessionLabel, totalQuestions } = body;
  if (!subjectKey || !sessionLabel || !totalQuestions || totalQuestions < 1) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = context.env.ACCESS_DB;
  if (!db) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  // Upsert user
  await db
    .prepare(
      `INSERT INTO users (email, last_login_at)
       VALUES (?, datetime('now'))
       ON CONFLICT(email) DO UPDATE SET last_login_at = datetime('now')`,
    )
    .bind(email)
    .run();

  const userRow = await db
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: number }>();

  if (!userRow) {
    return Response.json({ error: "Failed to resolve user" }, { status: 500 });
  }

  // Shuffle monster IDs 1–10
  const monsterOrder = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  // Game params
  const qPerMonster = Math.ceil(totalQuestions / 10);
  const maxWrong = Math.floor(totalQuestions * 0.3);

  const insertResult = await db
    .prepare(
      `INSERT INTO quiz_sessions (user_id, subject_key, session_label, total_questions)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(userRow.id, subjectKey, sessionLabel, totalQuestions)
    .run();

  const sessionId = insertResult.meta.last_row_id;

  return Response.json({
    sessionId,
    monsterOrder,
    totalQuestions,
    qPerMonster,
    maxWrong,
  });
};
