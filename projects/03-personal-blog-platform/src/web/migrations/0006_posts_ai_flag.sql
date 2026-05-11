-- Migration 0006: 為 posts 表加入 is_ai_generated 欄位
-- 用途：正確追蹤 AI 生成文章數量（刪除文章後自動減少，不重複計算重生成）

ALTER TABLE posts ADD COLUMN is_ai_generated INTEGER NOT NULL DEFAULT 0;

-- 回填：依 ai_generate_log 將已有的 AI 文章標記
UPDATE posts
SET is_ai_generated = 1
WHERE id IN (
  SELECT DISTINCT post_id FROM ai_generate_log WHERE post_id IS NOT NULL
);
