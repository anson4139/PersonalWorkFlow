import type { Env } from "../../_types";

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const slug = decodeURIComponent(params.slug as string);

  const post = await env.BLOG_DB.prepare(
    `
    SELECT id, title, slug, content, excerpt, cover_url, status, published_at
    FROM posts
    WHERE slug = ? AND status = 'published'
    LIMIT 1
  `,
  )
    .bind(slug)
    .first<{
      id: number;
      title: string;
      slug: string;
      content: string;
      excerpt: string;
      cover_url: string | null;
      status: string;
      published_at: string;
    }>();

  if (!post) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const [categoriesResult, tagsResult, prevResult, nextResult, relatedResult] =
    await Promise.all([
      env.BLOG_DB.prepare(
        `
      SELECT c.id, c.name, c.slug
      FROM post_categories pc JOIN categories c ON c.id = pc.category_id
      WHERE pc.post_id = ?
    `,
      )
        .bind(post.id)
        .all<{ id: number; name: string; slug: string }>(),
      env.BLOG_DB.prepare(
        `
      SELECT t.id, t.name, t.slug
      FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
      WHERE pt.post_id = ?
    `,
      )
        .bind(post.id)
        .all<{ id: number; name: string; slug: string }>(),
      env.BLOG_DB.prepare(
        `SELECT title, slug FROM posts
       WHERE status = 'published' AND published_at < (SELECT published_at FROM posts WHERE id = ?)
       ORDER BY published_at DESC LIMIT 1`,
      )
        .bind(post.id)
        .first<{ title: string; slug: string }>(),
      env.BLOG_DB.prepare(
        `SELECT title, slug FROM posts
       WHERE status = 'published' AND published_at > (SELECT published_at FROM posts WHERE id = ?)
       ORDER BY published_at ASC LIMIT 1`,
      )
        .bind(post.id)
        .first<{ title: string; slug: string }>(),
      env.BLOG_DB.prepare(
        `SELECT DISTINCT p.title, p.slug, p.excerpt, p.published_at
         FROM posts p
         JOIN post_categories pc ON pc.post_id = p.id
         WHERE pc.category_id IN (
           SELECT category_id FROM post_categories WHERE post_id = ?
         )
         AND p.id != ?
         AND p.status = 'published'
         ORDER BY p.published_at DESC
         LIMIT 3`,
      )
        .bind(post.id, post.id)
        .all<{
          title: string;
          slug: string;
          excerpt: string;
          published_at: string;
        }>(),
    ]);

  return Response.json({
    ...post,
    categories: categoriesResult.results,
    tags: tagsResult.results,
    prev_post: prevResult ?? null,
    next_post: nextResult ?? null,
    related_posts: relatedResult.results,
  });
};
