// Google OAuth 2.0 — flow Authorization Code (tanpa library, langsung ke endpoint Google).
// Env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL (https://app-beige-one-24.vercel.app di prod).
// ponytail: state OAuth disimpan di cookie sementara (bukan DB) — cukup untuk CSRF; tambahkan PKCE saat butuh native app.

import crypto from "crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE, createSession } from "./auth";
import { prisma } from "./prisma";
import { log } from "./log";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";
const STATE_COOKIE = "webuild_oauth_state";

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3100";
}

export function redirectUri(): string {
  return `${appUrl()}/api/auth/google/callback`;
}

// URL login Google — state acak disimpan di cookie httpOnly utk verifikasi callback
export function buildAuthUrl(): { url: string; state: string } {
  const state = crypto.randomBytes(16).toString("base64url");
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return { url: `${AUTH_ENDPOINT}?${params}`, state };
}

export async function setOAuthState(resState: string) {
  (await cookies()).set(STATE_COOKIE, resState, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 menit
    path: "/",
  });
}

export async function readAndClearOAuthState(): Promise<string | null> {
  const c = (await cookies()).get(STATE_COOKIE)?.value;
  if (c) (await cookies()).delete(STATE_COOKIE);
  return c ?? null;
}

type GoogleProfile = {
  sub: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
};

export async function exchangeCode(code: string): Promise<GoogleProfile | null> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: redirectUri(),
    grant_type: "authorization_code",
  });
  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) {
    log("warn", "google.token_gagal", { status: tokenRes.status });
    return null;
  }
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) return null;

  const uiRes = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!uiRes.ok) {
    log("warn", "google.userinfo_gagal", { status: uiRes.status });
    return null;
  }
  return (await uiRes.json()) as GoogleProfile;
}

// Cari user by googleId → email; buat baru jika belum ada. Return session cookie payload.
export async function upsertGoogleUser(profile: GoogleProfile) {
  const email = profile.email?.toLowerCase();
  if (!email || profile.email_verified === false) return null;

  const plan = await prisma.plan.upsert({
    where: { name: "FREE" },
    update: {},
    create: { name: "FREE", limits: { sites: 1, aiPerDay: 10, uploadMb: 50, fileMb: 2, revisions: 5 } },
  });

  let user = await prisma.user.findUnique({ where: { googleId: profile.sub }, select: { id: true, role: true } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: profile.name || email.split("@")[0],
        email,
        googleId: profile.sub,
        avatarUrl: profile.picture ?? null,
        planId: plan.id,
        tosAcceptedAt: new Date(),
      },
      select: { id: true, role: true },
    });
  }
  return user;
}

export async function setSessionCookie(res: Response, userId: string, role: string): Promise<Response> {
  const headers = new Headers(res.headers);
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${createSession(userId, role)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
