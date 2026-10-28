import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./session-shared";

// Session token: base64url(payload).hmacSHA256(payload, SESSION_SECRET)
// Hardening:
//  - SESSION_SECRET wajib di production (fail-closed: token dibuat/diterima tanpa secret → error/null).
//  - Payload membawa `v` (SESSION_VERSION) — naikkan untuk invalidate semua session lama sekaligus
//    (pengganti revocation list; cukup untuk logout-server-side global).
//  - Validasi tipe field payload sebelum dipercaya.
//  ponytail: stateless token, bukan DB session.
export { SESSION_COOKIE };
export const SESSION_VERSION = 1;
const SECRET = process.env.SESSION_SECRET || "";
const EXP_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

export type SessionPayload = { uid: string; role: string; exp: number; v?: number };

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

function signingSecret(): string {
  // fail-closed: production TANPA secret → jangan pernah pakai fallback dev
  if (!SECRET && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET wajib di-set di production");
  }
  return SECRET || "dev-secret-webuild";
}

function b64url(buf: Buffer) {
  return buf.toString("base64url");
}

export function createSession(userId: string, role: string): string {
  const payload: SessionPayload = { uid: userId, role, exp: Date.now() + EXP_MS, v: SESSION_VERSION };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = crypto.createHmac("sha256", signingSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySession(token: string): SessionPayload | null {
  // fail-closed di production tanpa secret
  if (!SECRET && process.env.NODE_ENV === "production") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", signingSecret()).update(body).digest("base64url");
  // constant-time compare
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (!payload.uid || typeof payload.uid !== "string") return null;
    if (!payload.role || typeof payload.role !== "string") return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (payload.v !== SESSION_VERSION) return null; // token pra-hardening → invalid otomatis
    return payload;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}
