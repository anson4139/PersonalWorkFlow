export const onRequestGet = async ({ params, env }) => {
    const slug = params.slug;
    const post = await env.BLOG_DB.prepare(`
    SELECT id, title, slug, content, excerpt, cover_url, status, published_at
    FROM posts
    WHERE slug = ? AND status = 'published'
    LIMIT 1
  `)
        .bind(slug)
        .first();
    if (!post) {
        return Response.json({ error: "Not found" }, { status: 404 });
    }
    const [categoriesResult, tagsResult, prevResult, nextResult] = await Promise.all([
        env.BLOG_DB.prepare(`
      SELECT c.id, c.name, c.slug
      FROM post_categories pc JOIN categories c ON c.id = pc.category_id
      WHERE pc.post_id = ?
    `)
            .bind(post.id)
            .all(),
        env.BLOG_DB.prepare(`
      SELECT t.id, t.name, t.slug
      FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
      WHERE pt.post_id = ?
    `)
            .bind(post.id)
            .all(),
        env.BLOG_DB.prepare(`SELECT title, slug FROM posts
       WHERE status = 'published' AND published_at < (SELECT published_at FROM posts WHERE id = ?)
       ORDER BY published_at DESC LIMIT 1`)
            .bind(post.id)
            .first(),
        env.BLOG_DB.prepare(`SELECT title, slug FROM posts
       WHERE status = 'published' AND published_at > (SELECT published_at FROM posts WHERE id = ?)
       ORDER BY published_at ASC LIMIT 1`)
            .bind(post.id)
            .first(),
    ]);
    return Response.json({
        ...post,
        categories: categoriesResult.results,
        tags: tagsResult.results,
        prev_post: prevResult ?? null,
        next_post: nextResult ?? null,
    });
};
