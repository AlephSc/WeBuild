// Rate limiter in-process + persist JSON ke /tmp (cross-invocation di serverless
// Cold start tetap aman: file /tmp bertahan antar lambda warm container di Vercel Node runtime).
// 429 → status code konsisten + header Retry-After.

import fs from "fs";
import os from "os";
import path from "path";
import { NextResponse } from "next/server";

// os.tmpdir(): /tmp di Linux/Vercel, %TEMP% di Windows (dev lokal) — dedup path platform.
const STORE_DIR = path.join(os.tmpdir(), "webuild-rl");
const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB — kalau lebih (serangan volume besar), reset saja

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

type Bucket = { tokens: number; ts: number }; // ts = last refill (epoch ms)

function bucketKey(name: string, id: string): string {
  // id bisa berisi karakter aneh dari IP / user agent → hash singkat
  return `${name}:${Buffer.from(id).toString("base64url").slice(0, 48)}`;
}

function loadStore(): Record<string, Bucket> {
  try {
    const file = path.join(STORE_DIR, "buckets.json");
    const st = fs.statSync(file);
    if (st.size > MAX_FILE_BYTES) {
      // hasil flood — reset lebih murah daripada keep parsing
      fs.rmSync(STORE_DIR, { recursive: true, force: true });
      return {};
    }
    return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, Bucket>;
  } catch {
    return {};
  }
}

function saveStore(store: Record<string, Bucket>) {
  try {
    fs.mkdirSync(STORE_DIR, { recursive: true });
    fs.writeFileSync(path.join(STORE_DIR, "buckets.json"), JSON.stringify(store));
  } catch {
    // kalau /tmp tidak bisa ditulis (read-only FS) — tetap jalan, rate-limit jadi per-invocation saja
  }
}

// Refill kontinu: token per detik = limit/windowMs, cap = limit
function refill(b: Bucket, limit: number, windowMs: number) {
  const now = Date.now();
  const elapsed = now - b.ts;
  if (elapsed <= 0) return;
  const rate = limit / windowMs;
  const gained = (elapsed * rate) | 0;
  if (gained > 0) {
    b.tokens = Math.min(limit, b.tokens + gained);
    b.ts = now;
  }
}

export function rateLimit(opts: {
  key: string; // nama bucket (mis. "report", "ai-gen:<uid>")
  id: string; // identitas unik (IP / uid)
  limit: number; // max request per window
  windowMs: number;
}): RateLimitResult {
  const k = bucketKey(opts.key, opts.id);
  const store = loadStore();
  const now = Date.now();
  let b = store[k];
  if (!b) {
    b = { tokens: opts.limit, ts: now };
    store[k] = b;
  }
  refill(b, opts.limit, opts.windowMs);
  if (b.tokens > 0) {
    b.tokens -= 1;
    const remaining = b.tokens;
    saveStore(store);
    return { ok: true, remaining, retryAfterSec: 0 };
  }
  // habis → hitung kapan token berikutnya tersedia
  const rate = opts.limit / opts.windowMs;
  const msToNext = Math.max(1, Math.ceil(1 / rate));
  saveStore(store);
  return { ok: false, remaining: 0, retryAfterSec: Math.ceil(msToNext / 1000) };
}

export function rateLimitResponse(retryAfterSec: number) {
  return NextResponse.json(
    { ok: false, error: "Terlalu banyak permintaan. Coba lagi sebentar lagi." },
    { status: 429, headers: { "Retry-After": String(Math.max(1, retryAfterSec)) } },
  );
}

// Ekstrak IP klien dari header proxy standar (Vercel/NGINX/Cloudflare) — fallback "unknown".
// Dipakai endpoint yang rate limit-nya per-IP (report publik, dll).
export function clientIpFrom(req: { headers: Headers }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
