import { json, requireAdmin, slugify } from "./_auth";
// GET    /api/admin/categories
// POST   /api/admin/categories
// PUT    /api/admin/categories/:id  (via ?id=)
// DELETE /api/admin/categories/:id (via ?id=)
export async function onRequest(ctx) {
    const { request, env } = ctx;
    const deny = requireAdmin(request, env);
    if (deny)
        return deny;
    const url = new URL(request.url);
    const id = url.searchParams.get("id")
        ? Number(url.searchParams.get("id"))
        : null;
    if (request.method === "GET") {
        const rows = await env.BLOG_DB.prepare(`SELECT c.id, c.name, c.slug, COUNT(pc.post_id) as post_count
       FROM categories c
       LEFT JOIN post_categories pc ON pc.category_id = c.id
       GROUP BY c.id ORDER BY c.name`).all();
        return json(rows.results);
    }
    if (request.method === "POST") {
        const body = (await request.json());
        if (!body.name?.trim())
            return json({ error: "name required" }, 400);
        const slug = body.slug?.trim() || slugify(body.name);
        const res = await env.BLOG_DB.prepare(`INSERT INTO categories (name, slug) VALUES (?, ?) RETURNING id`)
            .bind(body.name.trim(), slug)
            .first();
        return json({ id: res.id, slug }, 201);
    }
    if (request.method === "PUT" && id) {
        const body = (await request.json());
        const existing = await env.BLOG_DB.prepare(`SELECT * FROM categories WHERE id=?`)
            .bind(id)
            .first();
        if (!existing)
            return json({ error: "Not found" }, 404);
        const newName = body.name?.trim() ?? existing.name;
        const newSlug = body.slug?.trim() ?? (body.name ? slugify(newName) : existing.slug);
        await env.BLOG_DB.prepare(`UPDATE categories SET name=?, slug=? WHERE id=?`)
            .bind(newName, newSlug, id)
            .run();
        return json({ id, name: newName, slug: newSlug });
    }
    if (request.method === "DELETE" && id) {
        await env.BLOG_DB.prepare(`DELETE FROM categories WHERE id=?`)
            .bind(id)
            .run();
        return json({ deleted: id });
    }
    return json({ error: "Method Not Allowed" }, 405);
}
