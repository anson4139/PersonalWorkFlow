import { json, requireAdmin, slugify } from "./_auth";
// GET  /api/admin/posts  — 列表（含草稿）
// POST /api/admin/posts  — 新建文章
export async function onRequest(ctx) {
    const { request, env } = ctx;
    const deny = requireAdmin(request, env);
    if (deny)
        return deny;
    if (request.method === "GET") {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? 1);
        const per = Number(url.searchParams.get("per_page") ?? 20);
        const status = url.searchParams.get("status") ?? ""; // draft | published | ''
        const offset = (page - 1) * per;
        const where = status ? `WHERE p.status = ?` : "";
        const params = status
            ? [status, per, offset]
            : [per, offset];
        const countParams = status ? [status] : [];
        const total = await env.BLOG_DB.prepare(`SELECT COUNT(*) as n FROM posts p ${where}`)
            .bind(...countParams)
            .first();
        const rows = await env.BLOG_DB.prepare(`SELECT p.id, p.title, p.slug, p.status, p.published_at, p.created_at, p.updated_at,
              GROUP_CONCAT(DISTINCT c.name) as categories
       FROM posts p
       LEFT JOIN post_categories pc ON pc.post_id = p.id
       LEFT JOIN categories c ON c.id = pc.category_id
       ${where}
       GROUP BY p.id
       ORDER BY p.updated_at DESC
       LIMIT ? OFFSET ?`)
            .bind(...params)
            .all();
        return json({
            posts: rows.results,
            total: total?.n ?? 0,
            page,
            per_page: per,
        });
    }
    if (request.method === "POST") {
        const body = (await request.json());
        if (!body.title?.trim())
            return json({ error: "title required" }, 400);
        const slug = slugify(body.title) + "-" + Date.now().toString(36);
        const status = body.status ?? "draft";
        const publishedAt = status === "published"
            ? (body.published_at ?? new Date().toISOString())
            : null;
        const res = await env.BLOG_DB.prepare(`INSERT INTO posts (title, slug, content, excerpt, cover_url, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`)
            .bind(body.title.trim(), slug, body.content ?? "", body.excerpt ?? "", body.cover_url ?? null, status, publishedAt)
            .first();
        const postId = res.id;
        // 綁定分類
        if (body.category_ids?.length) {
            await Promise.all(body.category_ids.map((cid) => env.BLOG_DB.prepare(`INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)`)
                .bind(postId, cid)
                .run()));
        }
        // 綁定標籤
        if (body.tag_ids?.length) {
            await Promise.all(body.tag_ids.map((tid) => env.BLOG_DB.prepare(`INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)`)
                .bind(postId, tid)
                .run()));
        }
        return json({ id: postId, slug }, 201);
    }
    return json({ error: "Method Not Allowed" }, 405);
}
