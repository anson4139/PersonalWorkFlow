-- Migration 0004: Admin permissions table
-- super_admin (anson4139@gmail.com) is hardcoded in backend and never stored here.
-- Only 'admin' and 'editor' roles are stored in this table.
-- Apply local : wrangler d1 migrations apply BLOG_DB --local
-- Apply remote: wrangler d1 migrations apply BLOG_DB

CREATE TABLE IF NOT EXISTS admin_permissions (
  email       TEXT PRIMARY KEY,
  role        TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'editor')),
  note        TEXT,
  created_by  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
