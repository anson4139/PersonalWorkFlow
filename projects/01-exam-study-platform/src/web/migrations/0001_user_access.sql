CREATE TABLE IF NOT EXISTS user_access (
  email TEXT PRIMARY KEY,
  is_admin INTEGER NOT NULL DEFAULT 0,
  allowed_subjects TEXT NOT NULL,
  note TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_access_updated_at ON user_access(updated_at DESC);
