import type { Env } from "../_types";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const result = await env.BLOG_DB.prepare(
    `
    SELECT c.id, c.name, c.slug, COUNT(p.id) as post_count
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

  // 排除 post_count = 0 的分類（含只有草稿、無已發布文章的分類）及未分類虛擬行
  const rows = result.results.filter((r) => r.post_count > 0);

  return Response.json(rows);
};
