import { json, requireAdmin } from "./_auth";
// GET /api/admin/settings         — 取全部設定 { key: value, ... }
// PUT /api/admin/settings         — 批次更新 { key: value, ... }
export async function onRequest(ctx) {
    const { request, env } = ctx;
    const deny = requireAdmin(request, env);
    if (deny)
        return deny;
    if (request.method === "GET") {
        const rows = await env.BLOG_DB.prepare(`SELECT key, value FROM settings`).all();
        const obj = {};
        for (const r of rows.results)
            obj[r.key] = r.value;
        return json(obj);
    }
    if (request.method === "PUT") {
        const body = (await request.json());
        const stmts = Object.entries(body).map(([k, v]) => env.BLOG_DB.prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`).bind(k, String(v)));
        await env.BLOG_DB.batch(stmts);
        return json({ updated: Object.keys(body).length });
    }
    return json({ error: "Method Not Allowed" }, 405);
}
