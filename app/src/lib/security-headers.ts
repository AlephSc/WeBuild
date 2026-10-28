// Security headers terpusat — dipasang via proxy.ts (middleware) + fallback di next.config.ts.
// Nilai penting:
//  - CSP: 'unsafe-inline' hanya untuk style (Tailwind + style inline editor/blok user);
//    script dikunci 'self' (app pages + 'unsafe-inline' untuk hydration Next, publik pages tanpa inline script).
//  - frames: app pages DENY (anti-clickjacking); /s/:slug memakai frame-ancestors 'self' https:
//    (boleh di-embed; X-Frame-Options dihapus utk path ini karena tidak bisa mengekspresikan allowlist).

export type CspProfile = "app" | "public";

// host yang dipakai fitur produk: upload gambar (UploadThing utfs.io) & Google avatar
const IMG_SRC = "'self' data: blob: https://utfs.io https://*.ufs.sh https://lh3.googleusercontent.com";
const CONNECT = "'self' https://api.uploadthing.com https://uploadthing.com https://*.ingest.sentry.io";

function csp(profile: CspProfile): string {
  const base = [
    "default-src 'self'",
    `img-src ${IMG_SRC}`,
    `connect-src ${CONNECT}`,
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];
  if (profile === "app") {
    // dashboard/editor/admin: script 'self' + inline (hydrasi Next.js), style inline
    base.splice(1, 0, "script-src 'self' 'unsafe-inline'", "style-src 'self' 'unsafe-inline'");
  } else {
    // halaman publik (landing, /s/:slug): tanpa inline script, style inline utk template blok
    base.splice(1, 0, "script-src 'self'", "style-src 'self' 'unsafe-inline'");
  }
  return base.join("; ");
}

function cspProfileFor(pathname: string): CspProfile {
  // halaman publik (landing, /s/:slug) → CSP script ketat; lainnya profile app
  const isPublicPage = pathname === "/" || /^\/s\//.test(pathname);
  return isPublicPage ? "public" : "app";
}

export function securityHeadersFor(pathname: string): [string, string][] {
  // /s/:slug boleh di-embed (preview situs user) → frame-ancestors longgar
  const isPublicSite = /^\/s\/[^/]+/.test(pathname);
  let policy = csp(cspProfileFor(pathname));
  if (isPublicSite) {
    policy = policy.replace("frame-ancestors 'none'", "frame-ancestors 'self' https:");
  }

  const headers: [string, string][] = [
    ["Content-Security-Policy", policy],
    ["X-Content-Type-Options", "nosniff"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
    ["X-DNS-Prefetch-Control", "off"],
    ["Cross-Origin-Opener-Policy", "same-origin"],
    ["Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()"],
  ];

  // X-Frame-Options legacy: DENY untuk semua kecuali /s/:slug
  // (X-Frame-Options tidak mendukung allowlist multi-origin → di /s/:slug CSP frame-ancestors yang berlaku)
  if (!isPublicSite) headers.push(["X-Frame-Options", "DENY"]);

  // HSTS hanya saat HTTPS (prod/Vercel) — aktif semua subdomain
  if (process.env.NODE_ENV === "production") {
    headers.push(["Strict-Transport-Security", "max-age=31536000; includeSubDomains"]);
  }
  return headers;
}
