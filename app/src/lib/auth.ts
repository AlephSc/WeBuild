import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// Session token: base64url(payload).hmacSHA256(payload, SESSION_SECRET)
// ponytail: stateless token, bukan DB session — tambahkan revocation list saat butuh logout-server-side.
export const SESSION_COOKIE = "webuild_session";
const SECRET = process.env.SESSION_SECRET || "dev-secret-webuild";
const EXP_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

export type SessionPayload = { uid: string; role: string; exp: number };

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

function b64url(buf: Buffer) {
  return buf.toString("base64url");
}

export function createSession(userId: string, role: string): string {
  const payload: SessionPayload = { uid: userId, role, exp: Date.now() + EXP_MS };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySession(token: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  // constant-time compare
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (!payload.uid || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
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
