/**
 * Google ID Token (RS256) verification for Cloudflare Workers.
 * Uses the Web Crypto API and the CF Cache API to cache Google's public keys.
 */

const CERT_URL = "https://www.googleapis.com/oauth2/v3/certs";

interface JwkKey {
  kid: string;
  kty: string;
  alg: string;
  use: string;
  n: string;
  e: string;
}

interface JwksResponse {
  keys: JwkKey[];
}

export interface GoogleTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  aud: string | string[];
  iss: string;
  iat: number;
  exp: number;
}

// ── helpers ────────────────────────────────────────────────────

function b64UrlToUint8(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(b64 + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function parseHeader(token: string): { alg: string; kid: string } {
  const [headerB64] = token.split(".");
  const json = new TextDecoder().decode(b64UrlToUint8(headerB64));
  return JSON.parse(json);
}

function parsePayload(token: string): GoogleTokenPayload {
  const parts = token.split(".");
  const json = new TextDecoder().decode(b64UrlToUint8(parts[1]));
  return JSON.parse(json);
}

// ── cert fetch (CF Cache API) ──────────────────────────────────

async function fetchGoogleCerts(): Promise<JwksResponse> {
  // Use CF's Cache API so subsequent requests in the same edge hit the cache.
  const cache = caches.default;
  const req = new Request(CERT_URL);
  const cached = await cache.match(req);
  if (cached) return cached.json() as Promise<JwksResponse>;

  const fresh = await fetch(CERT_URL);
  if (!fresh.ok) throw new Error("Failed to fetch Google public certs");
  await cache.put(req, fresh.clone());
  return fresh.json() as Promise<JwksResponse>;
}

// ── main export ────────────────────────────────────────────────

/**
 * Verifies a Google ID Token (RS256).
 * @param token   Raw ID token string from Google Sign-In.
 * @param audience Expected `aud` claim – your Google OAuth client ID.
 * @returns Decoded payload on success; throws on any verification failure.
 */
export async function verifyGoogleIdToken(
  token: string,
  audience: string,
): Promise<GoogleTokenPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed JWT");

  const header = parseHeader(token);
  if (header.alg !== "RS256") throw new Error("Expected RS256 algorithm");

  // Fetch matching public key
  const certs = await fetchGoogleCerts();
  const jwk = certs.keys.find((k) => k.kid === header.kid);
  if (!jwk)
    throw new Error("No matching Google public key for kid=" + header.kid);

  // Import key
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    { ...jwk, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );

  // Verify signature
  const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const sig = b64UrlToUint8(parts[2]);
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    sig,
    signingInput,
  );
  if (!valid) throw new Error("Invalid token signature");

  // Validate claims
  const payload = parsePayload(token);
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error("Token expired");

  const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
  if (!validIssuers.includes(payload.iss))
    throw new Error("Invalid issuer: " + payload.iss);

  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(audience)) throw new Error("Invalid audience");

  if (!payload.email_verified) throw new Error("Google email not verified");

  return payload;
}

/**
 * Extracts the email from a Bearer token without verifying the signature.
 * Only use this for logging / non-security-critical paths.
 * For admin auth, always use verifyGoogleIdToken.
 */
export function extractEmailFromToken(token: string): string | null {
  try {
    const payload = parsePayload(token);
    return payload.email?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}
