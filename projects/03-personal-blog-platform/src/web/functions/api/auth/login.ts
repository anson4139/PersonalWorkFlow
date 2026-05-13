import type { Env } from "../../_types";
import { verifyGoogleIdToken } from "./_googleJwt";

const ADMIN_EMAIL = "anson4139@gmail.com";

// POST /api/auth/login
// Body: { id_token: string }
// Returns: { email, role, isAdmin, name, picture }
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.GOOGLE_CLIENT_ID) {
    return Response.json(
      { error: "Server not configured (missing GOOGLE_CLIENT_ID)" },
      { status: 500 },
    );
  }

  let body: { id_token?: string };
  try {
    body = await request.json<{ id_token?: string }>();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id_token } = body;
  if (!id_token || typeof id_token !== "string") {
    return Response.json({ error: "id_token is required" }, { status: 400 });
  }

  let payload;
  try {
    payload = await verifyGoogleIdToken(id_token, env.GOOGLE_CLIENT_ID);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Token verification failed";
    return Response.json({ error: msg }, { status: 401 });
  }

  const email = payload.email.toLowerCase();
  const isSuperAdmin = email === ADMIN_EMAIL;

  // Resolve features: super admin gets all; others query admin_permissions
  const ALL_FEATURES = [
    "posts",
    "ai-generate",
    "categories",
    "tags",
    "settings",
  ];
  let features: string[] = [];
  let isAdmin = isSuperAdmin;

  if (isSuperAdmin) {
    features = ALL_FEATURES;
  } else {
    try {
      const row = await env.BLOG_DB.prepare(
        `SELECT features FROM admin_permissions WHERE email = ? LIMIT 1`,
      )
        .bind(email)
        .first<{ features: string }>();
      if (row) {
        isAdmin = true;
        try {
          features = JSON.parse(row.features);
        } catch {
          features = [];
        }
      }
    } catch {
      // Non-fatal: admin_permissions table may not exist yet
    }
  }

  const role: "admin" | "user" = isAdmin ? "admin" : "user";

  // Upsert user_sessions + record login event
  try {
    await env.BLOG_DB.batch([
      env.BLOG_DB.prepare(
        `
        INSERT INTO user_sessions (email, role, last_login, login_count)
        VALUES (?, ?, datetime('now'), 1)
        ON CONFLICT(email) DO UPDATE SET
          role        = excluded.role,
          last_login  = excluded.last_login,
          login_count = login_count + 1
      `,
      ).bind(email, role),
      env.BLOG_DB.prepare(
        `INSERT INTO user_events (email, action, page, metadata) VALUES (?, 'login', null, null)`,
      ).bind(email),
    ]);
  } catch {
    // Non-fatal: continue even if upsert fails
  }

  return Response.json({
    email,
    role,
    isAdmin,
    features,
    name: payload.name ?? null,
    picture: payload.picture ?? null,
  });
};
