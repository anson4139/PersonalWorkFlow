-- Migration 0005: Replace role with features in admin_permissions
-- features: JSON array of allowed feature keys, e.g. ["posts","categories","tags"]
-- Available keys: posts | ai-generate | categories | tags | settings

DROP TABLE IF EXISTS admin_permissions;

CREATE TABLE IF NOT EXISTS admin_permissions (
  email       TEXT PRIMARY KEY,
  features    TEXT NOT NULL DEFAULT '["posts","categories","tags"]',
  note        TEXT,
  created_by  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
