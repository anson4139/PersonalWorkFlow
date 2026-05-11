import type { Env } from "../_types";
import { verifyGoogleIdToken } from "./auth/_googleJwt";

// POST /api/track
// Body: { action: string, page?: string, metadata?: object }
// Requires: Authorization: Bearer <google-id-token>
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // Must be logged in (any role); verify Bearer token
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ") || !env.GOOGLE_CLIENT_ID) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let email: string;
  try {
    const payload = await verifyGoogleIdToken(
      auth.slice(7),
      env.GOOGLE_CLIENT_ID,
    );
    email = payload.email.toLowerCase();
  } catch {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  let body: { action?: string; page?: string; metadata?: unknown };
  try {
    body = await request.json<{
      action?: string;
      page?: string;
      metadata?: unknown;
    }>();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, page, metadata } = body;
  if (!action || typeof action !== "string") {
    return Response.json({ error: "action is required" }, { status: 400 });
  }

  await env.BLOG_DB.prepare(
    `
    INSERT INTO user_events (email, action, page, metadata)
    VALUES (?, ?, ?, ?)
  `,
  )
    .bind(
      email,
      action,
      page ?? null,
      metadata != null ? JSON.stringify(metadata) : null,
    )
    .run();

  return Response.json({ ok: true });
};
