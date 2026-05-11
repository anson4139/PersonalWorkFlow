/**
 * 驗證是否為管理員請求。
 * 生產環境：CF Access 注入 Cf-Access-Authenticated-User-Email header。
 * 本機開發（wrangler pages dev --local）：X-Dev-Admin: true 繞過。
 */
export function requireAdmin(request, env) {
    // 本機開發 bypass
    const devBypass = request.headers.get("X-Dev-Admin");
    if (devBypass === "true")
        return null;
    // CF Access header
    const email = request.headers.get("Cf-Access-Authenticated-User-Email");
    if (email)
        return null;
    // ADMIN_SECRET bypass（無 CF Access 時）
    if (env.ADMIN_SECRET) {
        const secret = request.headers.get("X-Admin-Secret");
        if (secret === env.ADMIN_SECRET)
            return null;
    }
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
    });
}
export function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}
export function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
