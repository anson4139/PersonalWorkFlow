import type { EventContext } from "@cloudflare/workers-types";
import type { Env } from "../../_types";
import { verifyGoogleIdToken } from "./_googleJwt";

const ADMIN_EMAIL = "anson4139@gmail.com";

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
      return payload.email.toLowerCase();
    } catch {
      // fall through
    }
  }

  // 2. CF Access JWT header（生產環境）
  const cfEmail = request.headers.get("Cf-Access-Authenticated-User-Email");
  if (cfEmail) return cfEmail.toLowerCase().trim();

  // 3. 本機開發 bypass
  if (request.headers.get("X-Dev-Admin") === "true") return "dev@local";

  return null;
}

// GET /api/auth/me
export async function onRequestGet(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { request, env } = ctx;
  const email = await resolveEmail(request, env);

  if (!email) {
    return Response.json({ email: null, isAdmin: false }, { status: 200 });
  }

  const isAdmin = email === ADMIN_EMAIL || email === "dev@local";

  return Response.json({
    email,
    isAdmin,
    displayName: email.split("@")[0],
  });
}
