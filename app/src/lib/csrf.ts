// CSRF protection — double submit cookie dengan HMAC-signed token.
// Client fetch token dari GET /api/csrf (cookie dibaca via document.cookie —
// jadi csrf cookie TIDAK httpOnly), kirim balik via header X-CSRF-Token.
// Server verifikasi: cookie == header (timing-safe) DAN signature HMAC valid.
// Dipegang di middleware (edge) — hanya dependensi Web Crypto.

export const CSRF_COOKIE = "webuild_csrf";
export const CSRF_HEADER = "X-CSRF-Token";
export const CSRF_SECRET_ENV = "CSRF_SECRET";

// secret fallback: pakai SESSION_SECRET kalau ada (sudah >= 32 char di prod).
// Kalau dua-duanya tidak ada → dev mode saja, jangan pernah produksi.
function csrfSecret(): string {
  return process.env.CSRF_SECRET || process.env.SESSION_SECRET || "dev-csrf-secret";
}

async function hmac(msg: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(csrfSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Format: <nonce>.<sig> — sig = HMAC(nonce)
export async function generateCsrfToken(): Promise<string> {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const sig = await hmac(nonce);
  return `${nonce}.${sig}`;
}

export async function verifyCsrfToken(token: string | undefined | null): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const nonce = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^[a-f0-9]{32}$/.test(nonce)) return false; // nonce 32 hex chars (uuid tanpa strip)
  const expected = await hmac(nonce);
  if (sig.length !== expected.length) return false;
  // timing-safe compare di edge runtime (tanpa Buffer): XOR byte per byte
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

// Origin check kedua lapis — origin/Referer harus sama host dengan request.
export function sameOrigin(req: Request): boolean {
  const host = req.headers.get("host") ?? "";
  if (!host) return false;
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }
  // SameSite=Lax cookies sudah cukup untuk top-level navigasi;
  // request tanpa Origin & Referer (kebanyakan non-browser) → tolak di mutasi.
  return false;
}

export const CSRF_ERROR_STATUS = 403;
export const CSRF_ERROR_BODY = JSON.stringify({ ok: false, error: "CSRF token tidak valid" });
