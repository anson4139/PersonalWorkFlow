import type { EventContext } from "@cloudflare/workers-types";
import type { Env } from "../../_types";
import { json, requireAdmin } from "./_auth";

// GET    /api/admin/media  → 列出 R2 uploads/ 目錄下所有圖片
// DELETE /api/admin/media  → body { key: string } → 從 R2 刪除
export async function onRequest(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { request, env } = ctx;
  const deny = await requireAdmin(request, env);
  if (deny) return deny;

  if (!env.BLOG_IMAGES) {
    return json(
      {
        error:
          "R2 not configured. Enable R2 bucket binding in CF Dashboard first.",
      },
      503,
    );
  }

  // ── GET: 列出圖片清單 ──────────────────────────────────────────────────────
  if (request.method === "GET") {
    const listed = await env.BLOG_IMAGES.list({ prefix: "uploads/" });
    const objects = listed.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded.toISOString(),
      url: `/images/${obj.key}`,
    }));
    return json({ objects, truncated: listed.truncated }, 200);
  }

  // ── DELETE: 刪除指定圖片 ───────────────────────────────────────────────────
  if (request.method === "DELETE") {
    let body: { key?: string };
    try {
      body = await request.json<{ key?: string }>();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const key = body?.key;
    if (!key || typeof key !== "string" || !key.startsWith("uploads/")) {
      return json({ error: "Invalid or missing key" }, 400);
    }

    await env.BLOG_IMAGES.delete(key);
    return json({ ok: true }, 200);
  }

  return json({ error: "Method Not Allowed" }, 405);
}
