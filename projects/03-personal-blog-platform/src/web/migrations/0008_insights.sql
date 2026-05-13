-- Migration 0008: Industry trend insights table
-- Apply: npx wrangler d1 migrations apply BLOG_DB --remote

CREATE TABLE IF NOT EXISTS insights (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start      TEXT NOT NULL,           -- ISO week start date, e.g. "2026-05-11" (Monday)
  entity          TEXT NOT NULL,           -- e.g. "TSMC", "NVIDIA", "半導體"
  entity_group    TEXT NOT NULL DEFAULT 'company', -- "company" | "sector"
  hit_count       INTEGER NOT NULL DEFAULT 0,      -- news articles matched this week
  direction       TEXT NOT NULL,           -- AI-generated summary ≤150 chars
  key_events      TEXT,                    -- JSON array of notable titles, e.g. ["標題1","標題2"]
  impact          TEXT NOT NULL DEFAULT 'medium' CHECK (impact IN ('high','medium','low')),
  source_ids      TEXT,                    -- JSON array of linked post IDs (if any)
  data_source     TEXT NOT NULL DEFAULT 'finmind', -- "finmind" | "rss" | "hybrid"
  model_ver       TEXT,
  prompt_ver      TEXT NOT NULL DEFAULT '1.0',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_insights_week   ON insights(week_start);
CREATE INDEX IF NOT EXISTS idx_insights_entity ON insights(entity);
