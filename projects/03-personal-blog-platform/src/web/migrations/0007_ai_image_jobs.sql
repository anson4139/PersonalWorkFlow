-- Migration 0007: AI image generation background jobs
-- Apply: wrangler d1 migrations apply BLOG_DB --local

CREATE TABLE IF NOT EXISTS ai_image_jobs (
  id            TEXT PRIMARY KEY,
  kind          TEXT NOT NULL CHECK (kind IN ('cover', 'illustration')),
  post_id       INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'ready', 'failed')),
  payload       TEXT NOT NULL,
  result_url    TEXT,
  error_message TEXT,
  attempts      INTEGER NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at    DATETIME,
  finished_at   DATETIME
);

CREATE INDEX IF NOT EXISTS idx_ai_image_jobs_post_kind
ON ai_image_jobs (post_id, kind, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_image_jobs_status
ON ai_image_jobs (status, created_at DESC);
