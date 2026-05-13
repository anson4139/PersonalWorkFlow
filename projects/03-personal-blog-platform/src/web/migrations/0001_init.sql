-- Migration 0001: Initial schema for personal blog platform
-- Apply: wrangler d1 migrations apply BLOG_DB --local

CREATE TABLE IF NOT EXISTS posts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  content      TEXT NOT NULL DEFAULT '',
  excerpt      TEXT NOT NULL DEFAULT '',
  cover_url    TEXT,
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  published_at DATETIME,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS post_categories (
  post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Full-text search virtual table
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  title, excerpt, content,
  content=posts, content_rowid=id
);

-- Seed categories
INSERT OR IGNORE INTO categories (name, slug) VALUES
  ('PM 方法論', 'pm'),
  ('AI 應用', 'ai'),
  ('系統分析', 'sa'),
  ('職涯心得', 'career'),
  ('工具推薦', 'tools');

-- Seed tags
INSERT OR IGNORE INTO tags (name, slug) VALUES
  ('AI', 'ai'),
  ('PM', 'pm'),
  ('SA', 'sa'),
  ('Cloudflare', 'cloudflare'),
  ('React', 'react'),
  ('TypeScript', 'typescript'),
  ('職涯', 'career'),
  ('GitHub Copilot', 'copilot');
