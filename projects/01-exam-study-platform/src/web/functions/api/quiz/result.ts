import { getAccessIdentity } from "../../_shared/access";

interface Env {
  ANSON_EMAIL?: string;
  TEAM_DOMAIN?: string;
  ACCESS_DB?: D1Database;
  VITE_DEV_VIEWER_EMAIL?: string;
}

interface ResultRequest {
  sessionId: number;
  status: "passed" | "failed" | "gameover";
}

interface RewardEntry {
  type: string;
  points: number;
  description: string;
}

interface SessionRow {
  id: number;
  status: string;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
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

  let body: ResultRequest;
  try {
    body = (await context.request.json()) as ResultRequest;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { sessionId, status } = body;

  if (!sessionId || !["passed", "failed", "gameover"].includes(status)) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
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
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const session = await db
    .prepare(
      "SELECT id, status, total_questions, correct_count, wrong_count FROM quiz_sessions WHERE id = ? AND user_id = ?",
    )
    .bind(sessionId, userRow.id)
    .first<SessionRow>();

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "ongoing") {
    return Response.json(
      { error: "Session already finalized" },
      { status: 409 },
    );
  }

  const score = Math.round(
    (session.correct_count / session.total_questions) * 100,
  );
  const monstersDefeated = Math.floor(
    session.correct_count / Math.ceil(session.total_questions / 10),
  );

  // Reward calculation
  const rewards: RewardEntry[] = [];
  rewards.push({ type: "complete", points: 50, description: "完成測驗" });

  const correctPoints = session.correct_count * 2;
  if (correctPoints > 0) {
    rewards.push({
      type: "correct",
      points: correctPoints,
      description: `答對 ${session.correct_count} 題 (+${correctPoints})`,
    });
  }

  if (status === "passed") {
    rewards.push({ type: "pass", points: 30, description: "及格獎勵" });
  }

  if (score === 100) {
    rewards.push({ type: "perfect", points: 100, description: "全對獎勵" });
  }

  const totalPointsEarned = rewards.reduce((sum, r) => sum + r.points, 0);

  await db
    .prepare(
      `UPDATE quiz_sessions SET status = ?, score = ?, ended_at = datetime('now') WHERE id = ?`,
    )
    .bind(status, score, sessionId)
    .run();

  for (const reward of rewards) {
    await db
      .prepare(
        `INSERT INTO reward_logs (user_id, session_id, reward_type, points, description)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        userRow.id,
        sessionId,
        reward.type,
        reward.points,
        reward.description,
      )
      .run();
  }

  await db
    .prepare("UPDATE users SET total_points = total_points + ? WHERE id = ?")
    .bind(totalPointsEarned, userRow.id)
    .run();

  return Response.json({
    score,
    status,
    correctCount: session.correct_count,
    wrongCount: session.wrong_count,
    totalQuestions: session.total_questions,
    monstersDefeated,
    pointsEarned: totalPointsEarned,
    rewards,
  });
};
