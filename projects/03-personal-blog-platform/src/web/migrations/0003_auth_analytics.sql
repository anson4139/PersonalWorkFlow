-- Migration 0003: Google OAuth sessions + user event tracking
-- Apply local : wrangler d1 migrations apply BLOG_DB --local
-- Apply remote: wrangler d1 migrations apply BLOG_DB

-- ── user_sessions ─────────────────────────────────────────────
-- One row per Google account that has ever logged in.
CREATE TABLE IF NOT EXISTS user_sessions (
  email       TEXT    PRIMARY KEY,
  role        TEXT    NOT NULL DEFAULT 'user'
                      CHECK (role IN ('admin', 'user')),
  last_login  TEXT,
  login_count INTEGER NOT NULL DEFAULT 0
);

-- ── user_events ───────────────────────────────────────────────
-- Behaviour events for logged-in users only.
CREATE TABLE IF NOT EXISTS user_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL,
  action     TEXT    NOT NULL,
  page       TEXT,
  metadata   TEXT,   -- JSON string
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_events_email_created
  ON user_events(email, created_at);

CREATE INDEX IF NOT EXISTS idx_user_events_action
  ON user_events(action);
