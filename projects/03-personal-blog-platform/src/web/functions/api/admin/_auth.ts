import type { Env } from "../_types";
import { verifyGoogleIdToken } from "../auth/_googleJwt";

const SUPER_ADMIN_EMAIL = "anson4139@gmail.com";

/** 從請求取得已驗證的 Google email，失敗回傳 null */
async function resolveEmail(
  request: Request,
  env: Env,
): Promise<string | null> {
  // 1. Google ID Token (Bearer)
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ") && env.GOOGLE_CLIENT_ID) {
    try {
      const payload = await verifyGoogleIdToken(
        auth.slice(7),
        env.GOOGLE_CLIENT_ID,
      );
      return payload.email?.toLowerCase() ?? null;
    } catch {
      // fall through
    }
  }

  // 3. CF Access header（已由 CF 驗簽）
  const cfEmail = request.headers.get("Cf-Access-Authenticated-User-Email");
  if (cfEmail) return cfEmail.toLowerCase();

  // 4. ADMIN_SECRET bypass
  if (env.ADMIN_SECRET) {
    const secret = request.headers.get("X-Admin-Secret");
    if (secret === env.ADMIN_SECRET) return SUPER_ADMIN_EMAIL;
  }

  return null;
}

/**
 * 驗證是否為 super_admin（hardcoded anson4139@gmail.com）。
 * Returns null on success, Response on failure.
 */
export async function requireSuperAdmin(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const email = await resolveEmail(request, env);
  if (email === SUPER_ADMIN_EMAIL) return null;
  return new Response(
    JSON.stringify({ error: "Forbidden: super_admin only" }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    },
  );
}

/**
 * 驗證是否為管理員（super_admin 或 admin_permissions 表中的帳號）。
 * Returns null on success (caller proceeds), Response on failure.
 */
export async function requireAdmin(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const email = await resolveEmail(request, env);
  if (!email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // super_admin 永遠通過
  if (email === SUPER_ADMIN_EMAIL) return null;

  // 查 D1 admin_permissions 表
  try {
    const row = await env.BLOG_DB.prepare(
      `SELECT email FROM admin_permissions WHERE email = ?`,
    )
      .bind(email)
      .first();
    if (row) return null;
  } catch {
    // D1 table may not exist yet (before migration), fall through
  }

  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function slugify(text: string): string {
  const ascii = text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  // If the result is empty (e.g. pure CJK input), use percent-encoded form
  if (!ascii) {
    return (
      encodeURIComponent(text.trim().toLowerCase())
        .replace(/%/g, "")
        .slice(0, 60) || Date.now().toString(36)
    );
  }
  return ascii;
}
