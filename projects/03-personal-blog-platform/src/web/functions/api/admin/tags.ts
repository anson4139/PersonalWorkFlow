import type { EventContext } from "@cloudflare/workers-types";
import type { Env } from "../../_types";
import { json, requireAdmin, slugify } from "./_auth";

// GET    /api/admin/tags
// POST   /api/admin/tags
// PUT    /api/admin/tags?id=
// DELETE /api/admin/tags?id=
export async function onRequest(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { request, env } = ctx;
  const deny = await requireAdmin(request, env);
  if (deny) return deny;

  const url = new URL(request.url);
  const id = url.searchParams.get("id")
    ? Number(url.searchParams.get("id"))
    : null;

  if (request.method === "GET") {
    const rows = await env.BLOG_DB.prepare(
      `SELECT t.id, t.name, t.slug, COUNT(pt.post_id) as post_count
       FROM tags t
       LEFT JOIN post_tags pt ON pt.tag_id = t.id
       GROUP BY t.id ORDER BY t.name`,
    ).all();
    return json(rows.results);
  }

  if (request.method === "POST") {
    const body = (await request.json()) as { name: string; slug?: string };
    if (!body.name?.trim()) return json({ error: "name required" }, 400);
    const slug = body.slug?.trim() || slugify(body.name);
    const res = await env.BLOG_DB.prepare(
      `INSERT INTO tags (name, slug) VALUES (?, ?) RETURNING id`,
    )
      .bind(body.name.trim(), slug)
      .first<{ id: number }>();
    return json({ id: res!.id, slug }, 201);
  }

  if (request.method === "PUT" && id) {
    const body = (await request.json()) as { name?: string; slug?: string };
    const existing = await env.BLOG_DB.prepare(`SELECT * FROM tags WHERE id=?`)
      .bind(id)
      .first<{ name: string; slug: string }>();
    if (!existing) return json({ error: "Not found" }, 404);
    const newName = body.name?.trim() ?? existing.name;
    const newSlug =
      body.slug?.trim() ?? (body.name ? slugify(newName) : existing.slug);
    await env.BLOG_DB.prepare(`UPDATE tags SET name=?, slug=? WHERE id=?`)
      .bind(newName, newSlug, id)
      .run();
    return json({ id, name: newName, slug: newSlug });
  }

  if (request.method === "DELETE" && id) {
    await env.BLOG_DB.prepare(`DELETE FROM tags WHERE id=?`).bind(id).run();
    return json({ deleted: id });
  }

  return json({ error: "Method Not Allowed" }, 405);
}
