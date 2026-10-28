// proxy.ts = middleware Next 16 (pengganti middleware.ts). Tugas:
//  1. Terapkan security headers di semua response.
//  2. Proteksi halaman privat (dashboard/editor/admin) — redirect ke /login
//     kalau session cookie tidak ada/tidak valid. Verifikasi HMAC signature
//     via Web Crypto (edge-safe, sama algoritma dengan src/lib/auth.ts).
//  3. CSRF gate untuk semua mutasi /api/*: verifikasi double-submit cookie
//     (cookie webuild_csrf + header X-CSRF-Token) + same-origin.
//  4. Rate limit global ringan per-IP untuk /api/* (brake volume attack;
//     endpoint sensitif punya limit spesifik di route masing-masing).

import { NextRequest, NextResponse } from "next/server";
import { CSRF_COOKIE, CSRF_HEADER, sameOrigin, verifyCsrfToken } from "@/lib/csrf";
import { SESSION_COOKIE } from "@/lib/session-shared";
import { securityHeadersFor } from "@/lib/security-headers";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const PRIVAT_PAGES = [/^\/dashboard(\/|$)/, /^\/editor(\/|$)/, /^\/admin(\/|$)/];

// Verifikasi token session (body.sig) — edge-safe, tanpa Node crypto.
// Harus sinkron dengan verifySession() di src/lib/auth.ts.
async function verifyTokenShape(token: string, secret: string): Promise<boolean> {
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!body || !sig) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return false;
  // exp check (payload JSON)
  try {
    const b64 = body.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(b64));
    return typeof json.exp === "number" && json.exp > Date.now();
  } catch {
    return false;
  }
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function harden(res: NextResponse, pathname: string): NextResponse {
  for (const [k, v] of securityHeadersFor(pathname)) res.headers.set(k, v);
  return res;
}

export default async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // ===== 1) API: CSRF gate + rate limit global =====
  if (pathname.startsWith("/api/")) {
    const isMutation = req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS";
    if (isMutation) {
      // exempt: uploadthing (proteksi signature SDK-nya sendiri, dipanggil server-to-server) — tetap wajib same-origin? tidak: webhook pihak ketiga.
      const exempt = pathname.startsWith("/api/uploadthing");
      if (!exempt) {
        const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
        const headerToken = req.headers.get(CSRF_HEADER);
        const okOrigin = sameOrigin(req);
        const okToken = await verifyCsrfToken(cookieToken && cookieToken === headerToken ? cookieToken : undefined);
        if (!okOrigin || !okToken) {
          return harden(
            NextResponse.json({ ok: false, error: "CSRF token tidak valid" }, { status: 403 }),
            pathname,
          );
        }
      }

      // rate limit global ringan per-IP (120 req / menit) — brake volume abuse
      const rl = rateLimit({ key: "api", id: clientIp(req), limit: 120, windowMs: 60_000 });
      if (!rl.ok) return harden(rateLimitResponse(rl.retryAfterSec), pathname);
    }

    return harden(NextResponse.next(), pathname);
  }

  // ===== 2) Halaman privat: cek cookie session =====
  if (PRIVAT_PAGES.some((re) => re.test(pathname))) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const secret = process.env.SESSION_SECRET || "dev-secret-webuild";
    const valid = token ? await verifyTokenShape(token, secret) : false;
    if (!valid) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return harden(NextResponse.redirect(loginUrl), pathname);
    }
  }

  // ===== 3) Halaman umum =====
  return harden(NextResponse.next(), pathname);
}

export const config = {
  matcher: [
    // semua kecuali static assets & _next internal
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
