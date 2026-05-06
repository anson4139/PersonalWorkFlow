-- Migration: 0002_quiz_battle
-- V4 怪獸對戰模式所需資料表
-- Apply local:  npx wrangler d1 execute exam-study-platform-access --local --file=migrations/0002_quiz_battle.sql
-- Apply remote: npx wrangler d1 execute exam-study-platform-access --file=migrations/0002_quiz_battle.sql

-- ─────────────────────────────────────────────
-- 1. users
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  display_name  TEXT,
  total_points  INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─────────────────────────────────────────────
-- 2. monsters
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monsters (
  id            INTEGER PRIMARY KEY,
  name          TEXT    NOT NULL,
  idle_image    TEXT    NOT NULL,
  battle_image  TEXT    NOT NULL,
  style_tag     TEXT    NOT NULL DEFAULT 'rpg',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 1
);

-- ─────────────────────────────────────────────
-- 3. quiz_sessions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id                 INTEGER NOT NULL REFERENCES users(id),
  subject_key             TEXT    NOT NULL,
  session_label           TEXT    NOT NULL,
  total_questions         INTEGER NOT NULL,
  answered_count          INTEGER NOT NULL DEFAULT 0,
  correct_count           INTEGER NOT NULL DEFAULT 0,
  wrong_count             INTEGER NOT NULL DEFAULT 0,
  score                   INTEGER,
  status                  TEXT    NOT NULL DEFAULT 'ongoing',
  current_monster_index   INTEGER NOT NULL DEFAULT 0,
  current_question_index  INTEGER NOT NULL DEFAULT 0,
  started_at              TEXT    NOT NULL DEFAULT (datetime('now')),
  ended_at                TEXT
);

-- status: 'ongoing' | 'passed' | 'failed' | 'gameover'
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON quiz_sessions(user_id, started_at DESC);

-- ─────────────────────────────────────────────
-- 4. quiz_session_answers
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_session_answers (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id         INTEGER NOT NULL REFERENCES quiz_sessions(id),
  question_index     INTEGER NOT NULL,
  selected_answer    TEXT    NOT NULL,
  correct_answer     TEXT    NOT NULL,
  is_correct         INTEGER NOT NULL DEFAULT 0,
  explanation_shown  INTEGER NOT NULL DEFAULT 0,
  answer_time_ms     INTEGER,
  monster_id         INTEGER NOT NULL REFERENCES monsters(id),
  created_at         TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_answers_session ON quiz_session_answers(session_id);

-- ─────────────────────────────────────────────
-- 5. reward_logs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reward_logs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  session_id   INTEGER NOT NULL REFERENCES quiz_sessions(id),
  reward_type  TEXT    NOT NULL,
  points       INTEGER NOT NULL DEFAULT 0,
  description  TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reward_logs_user ON reward_logs(user_id, created_at DESC);
