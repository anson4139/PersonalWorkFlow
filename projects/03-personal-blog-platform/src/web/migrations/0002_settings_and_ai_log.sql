-- Migration 0002: settings table + AI generation audit log
-- Apply: wrangler d1 migrations apply BLOG_DB --local

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed default author settings
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('author_name',    'Anson'),
  ('author_bio',     '全端開發者，熱愛 AI 應用與系統架構設計。'),
  ('author_avatar',  '/avatar.jpg'),
  ('site_title',     'BU AN LA AI.'),
  ('site_url',       'https://personal-blog-platform.pages.dev'),
  ('footer_links',   '[]');

CREATE TABLE IF NOT EXISTS ai_generate_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  source_url    TEXT NOT NULL,
  style         TEXT NOT NULL,
  model_text    TEXT NOT NULL DEFAULT 'gpt-5.5',
  model_image   TEXT NOT NULL DEFAULT 'gpt-image-2',
  post_id       INTEGER REFERENCES posts(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','error')),
  error_message TEXT,
  cost_usd      REAL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
