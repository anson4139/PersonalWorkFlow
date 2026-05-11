import type { Env } from "../_types";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const result = await env.BLOG_DB.prepare(
    `
    SELECT c.id, c.name, c.slug, COUNT(pc.post_id) as post_count
    FROM categories c
    LEFT JOIN post_categories pc ON pc.category_id = c.id
    LEFT JOIN posts p ON p.id = pc.post_id AND p.status = 'published'
    GROUP BY c.id
    UNION ALL
    SELECT -1 as id, '未分類' as name, 'uncategorized' as slug,
      COUNT(*) as post_count
    FROM posts
    WHERE status = 'published'
      AND id NOT IN (SELECT post_id FROM post_categories)
    ORDER BY post_count DESC
  `,
  ).all<{ id: number; name: string; slug: string; post_count: number }>();

  // 第二步：毌除 post_count = 0 的未分類虚擬行（所有文章都有分類時不顯示）
  const rows = result.results.filter((r) => r.id !== -1 || r.post_count > 0);

  return Response.json(rows);
};
