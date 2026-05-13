import type { EventContext } from "@cloudflare/workers-types";
import type { Env } from "../../../_types";
import { json, requireAdmin, slugify } from "../_auth";

// GET    /api/admin/posts/:id
// PUT    /api/admin/posts/:id
// DELETE /api/admin/posts/:id
export async function onRequest(
  ctx: EventContext<Env, "id", Record<string, unknown>>,
) {
  const { request, env, params } = ctx;
  const deny = await requireAdmin(request, env);
  if (deny) return deny;

  const id = Number(params.id);
  if (isNaN(id)) return json({ error: "Invalid id" }, 400);

  if (request.method === "GET") {
    const post = await env.BLOG_DB.prepare(
      `SELECT p.*,
              GROUP_CONCAT(DISTINCT c.id) as category_ids,
              GROUP_CONCAT(DISTINCT t.id) as tag_ids
       FROM posts p
       LEFT JOIN post_categories pc ON pc.post_id = p.id
       LEFT JOIN categories c ON c.id = pc.category_id
       LEFT JOIN post_tags pt ON pt.post_id = p.id
       LEFT JOIN tags t ON t.id = pt.tag_id
       WHERE p.id = ?
       GROUP BY p.id`,
    )
      .bind(id)
      .first();
    if (!post) return json({ error: "Not found" }, 404);
    return json(post);
  }

  if (request.method === "PUT") {
    const body = (await request.json()) as {
      title?: string;
      content?: string;
      excerpt?: string;
      cover_url?: string;
      status?: string;
      published_at?: string;
      category_ids?: number[];
      tag_ids?: number[];
    };

    const existing = await env.BLOG_DB.prepare(
      `SELECT id, title, slug, content, excerpt, cover_url, status, published_at FROM posts WHERE id = ?`,
    )
      .bind(id)
      .first<{
        id: number;
        title: string;
        slug: string;
        content: string;
        excerpt: string;
        cover_url: string | null;
        status: string;
        published_at: string | null;
      }>();
    if (!existing) return json({ error: "Not found" }, 404);

    const newTitle = body.title?.trim() ?? existing.title;
    const newSlug = body.title
      ? slugify(newTitle) + "-" + existing.slug.split("-").pop()
      : existing.slug;
    const newStatus = body.status ?? existing.status;
    const newPublishedAt =
      newStatus === "published"
        ? (body.published_at ??
          existing.published_at ??
          new Date().toISOString())
        : existing.published_at;

    await env.BLOG_DB.prepare(
      `UPDATE posts SET title=?, slug=?, content=?, excerpt=?, cover_url=?, status=?, published_at=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    )
      .bind(
        newTitle,
        newSlug,
        body.content ?? existing.content,
        body.excerpt ?? existing.excerpt,
        body.cover_url !== undefined
          ? body.cover_url || null
          : existing.cover_url,
        newStatus,
        newPublishedAt,
        id,
      )
      .run();

    // 重設分類
    if (body.category_ids !== undefined) {
      await env.BLOG_DB.prepare(`DELETE FROM post_categories WHERE post_id=?`)
        .bind(id)
        .run();
      if (body.category_ids.length) {
        await Promise.all(
          body.category_ids.map((cid) =>
            env.BLOG_DB.prepare(
              `INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)`,
            )
              .bind(id, cid)
              .run(),
          ),
        );
      }
    }

    // 重設標籤
    if (body.tag_ids !== undefined) {
      await env.BLOG_DB.prepare(`DELETE FROM post_tags WHERE post_id=?`)
        .bind(id)
        .run();
      if (body.tag_ids.length) {
        await Promise.all(
          body.tag_ids.map((tid) =>
            env.BLOG_DB.prepare(
              `INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)`,
            )
              .bind(id, tid)
              .run(),
          ),
        );
      }
    }

    return json({ id, slug: newSlug });
  }

  if (request.method === "DELETE") {
    await env.BLOG_DB.prepare(`DELETE FROM posts WHERE id=?`).bind(id).run();
    return json({ deleted: id });
  }

  return json({ error: "Method Not Allowed" }, 405);
}
