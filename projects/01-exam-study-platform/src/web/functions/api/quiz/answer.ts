import { getAccessIdentity } from "../../_shared/access";

interface Env {
  ANSON_EMAIL?: string;
  TEAM_DOMAIN?: string;
  ACCESS_DB?: D1Database;
  VITE_DEV_VIEWER_EMAIL?: string;
}

interface AnswerRequest {
  sessionId: number;
  questionIndex: number;
  selectedAnswer: string;
  correctAnswer: string;
  monsterId: number;
  answerTimeMs?: number;
  explanationShown?: boolean;
}

interface SessionRow {
  id: number;
  status: string;
  answered_count: number;
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

  let body: AnswerRequest;
  try {
    body = (await context.request.json()) as AnswerRequest;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    sessionId,
    questionIndex,
    selectedAnswer,
    correctAnswer,
    monsterId,
    answerTimeMs,
    explanationShown,
  } = body;

  if (
    !sessionId ||
    questionIndex === undefined ||
    !selectedAnswer ||
    !correctAnswer ||
    !monsterId
  ) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = context.env.ACCESS_DB;
  if (!db) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  const userRow = await db
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: number }>();

  if (!userRow) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const session = await db
    .prepare(
      "SELECT id, status, answered_count, correct_count, wrong_count FROM quiz_sessions WHERE id = ? AND user_id = ?",
    )
    .bind(sessionId, userRow.id)
    .first<SessionRow>();

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "ongoing") {
    return Response.json({ error: "Session already ended" }, { status: 409 });
  }

  const isCorrect =
    selectedAnswer.toUpperCase() === correctAnswer.toUpperCase() ? 1 : 0;

  await db
    .prepare(
      `INSERT INTO quiz_session_answers
         (session_id, question_index, selected_answer, correct_answer, is_correct, explanation_shown, answer_time_ms, monster_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      sessionId,
      questionIndex,
      selectedAnswer.toUpperCase(),
      correctAnswer.toUpperCase(),
      isCorrect,
      explanationShown ? 1 : 0,
      answerTimeMs ?? null,
      monsterId,
    )
    .run();

  const newAnswered = session.answered_count + 1;
  const newCorrect = session.correct_count + (isCorrect ? 1 : 0);
  const newWrong = session.wrong_count + (isCorrect ? 0 : 1);

  await db
    .prepare(
      `UPDATE quiz_sessions
       SET answered_count = ?, correct_count = ?, wrong_count = ?, current_question_index = ?
       WHERE id = ?`,
    )
    .bind(newAnswered, newCorrect, newWrong, questionIndex + 1, sessionId)
    .run();

  return Response.json({
    isCorrect: Boolean(isCorrect),
    answeredCount: newAnswered,
    correctCount: newCorrect,
    wrongCount: newWrong,
  });
};
