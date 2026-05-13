export const onRequestGet = async ({ env }) => {
    const result = await env.BLOG_DB.prepare(`
    SELECT c.id, c.name, c.slug, COUNT(pc.post_id) as post_count
    FROM categories c
    LEFT JOIN post_categories pc ON pc.category_id = c.id
    LEFT JOIN posts p ON p.id = pc.post_id AND p.status = 'published'
    GROUP BY c.id
    ORDER BY post_count DESC
  `).all();
    return Response.json(result.results);
};
