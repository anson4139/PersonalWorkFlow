import type { EventContext } from "@cloudflare/workers-types";
import type { Env } from "../../_types";
import { json, requireSuperAdmin } from "./_auth";

const SUPER_ADMIN_EMAIL = "anson4139@gmail.com";

// GET  /api/admin/permissions — 列出所有授權帳號（僅 super_admin）
// POST /api/admin/permissions — 新增授權（僅 super_admin）
// DELETE /api/admin/permissions?email=xxx — 移除授權（僅 super_admin）

export async function onRequest(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { request, env } = ctx;

  // 所有 permissions API 操作只有 super_admin 才能執行
  const deny = await requireSuperAdmin(request, env);
  if (deny) return deny;

  if (request.method === "GET") {
    const rows = await env.BLOG_DB.prepare(
      `SELECT email, features, note, created_by, created_at FROM admin_permissions ORDER BY created_at DESC`,
    ).all();
    // Parse features JSON for each row
    const permissions = (rows.results as Array<Record<string, unknown>>).map(
      (r) => ({
        ...r,
        features: (() => {
          try {
            return JSON.parse(r.features as string);
          } catch {
            return [];
          }
        })(),
      }),
    );
    return json({ permissions });
  }

  if (request.method === "POST") {
    let body: { email?: string; features?: string[]; note?: string };
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const email = (body.email ?? "").trim().toLowerCase();
    const features = Array.isArray(body.features) ? body.features : [];
    const note = body.note ?? null;

    if (!email || !email.includes("@")) {
      return json({ error: "email 格式不正確" }, 400);
    }
    const VALID_FEATURES = [
      "dashboard",
      "posts",
      "ai-generate",
      "categories",
      "tags",
      "settings",
    ];
    const invalidFeature = features.find((f) => !VALID_FEATURES.includes(f));
    if (invalidFeature) {
      return json({ error: `無效的功能鍵：${invalidFeature}` }, 400);
    }
    if (features.length === 0) {
      return json({ error: "至少需要授權一項功能" }, 400);
    }
    // 不能授權 super_admin 帳號
    if (email === SUPER_ADMIN_EMAIL) {
      return json({ error: "不能對 super_admin 帳號進行授權操作" }, 400);
    }

    // 取得操作者 email（來自 JWT payload）
    const createdBy = await getCallerEmail(request, env);
    const featuresJson = JSON.stringify(features);

    await env.BLOG_DB.prepare(
      `INSERT INTO admin_permissions (email, features, note, created_by)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET features=excluded.features, note=excluded.note, created_by=excluded.created_by`,
    )
      .bind(email, featuresJson, note, createdBy)
      .run();

    return json({ ok: true, email, features });
  }

  if (request.method === "DELETE") {
    const url = new URL(request.url);
    const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();

    if (!email) return json({ error: "缺少 email 參數" }, 400);
    if (email === SUPER_ADMIN_EMAIL) {
      return json({ error: "不能刪除 super_admin 的授權" }, 400);
    }

    await env.BLOG_DB.prepare(`DELETE FROM admin_permissions WHERE email = ?`)
      .bind(email)
      .run();

    return json({ ok: true });
  }

  return json({ error: "Method Not Allowed" }, 405);
}

/** 從 Bearer token 解析 caller email（best effort） */
async function getCallerEmail(
  request: Request,
  env: Env,
): Promise<string | null> {
  try {
    const { verifyGoogleIdToken } = await import("../auth/_googleJwt");
    const auth = request.headers.get("Authorization");
    if (auth?.startsWith("Bearer ") && env.GOOGLE_CLIENT_ID) {
      const payload = await verifyGoogleIdToken(
        auth.slice(7),
        env.GOOGLE_CLIENT_ID,
      );
      return payload.email ?? null;
    }
  } catch {
    // ignore
  }
  return null;
}
