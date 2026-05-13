import type { EventContext } from "@cloudflare/workers-types";
import type { Env } from "../_types";

// GET /api/settings — public, no auth required
// Returns only the public-safe keys
const PUBLIC_KEYS = [
  "author_name",
  "author_tagline",
  "author_bio",
  "author_avatar",
  "site_name",
  "site_description",
];

export async function onRequestGet(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { env } = ctx;
  const placeholders = PUBLIC_KEYS.map(() => "?").join(", ");
  const rows = await env.BLOG_DB.prepare(
    `SELECT key, value FROM settings WHERE key IN (${placeholders})`,
  )
    .bind(...PUBLIC_KEYS)
    .all<{ key: string; value: string }>();

  const obj: Record<string, string> = {};
  for (const r of rows.results) obj[r.key] = r.value;

  return new Response(JSON.stringify(obj), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
    },
  });
}
