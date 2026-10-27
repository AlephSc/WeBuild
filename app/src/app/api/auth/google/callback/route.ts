import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, readAndClearOAuthState, upsertGoogleUser } from "@/lib/google-auth";
import { SESSION_COOKIE, createSession } from "@/lib/auth";
import { log } from "@/lib/log";

// GET /api/auth/google/callback — Google redirect ke sini dengan ?code&state
export async function GET(req: NextRequest) {
  const appUrl = process.env.APP_URL || "http://localhost:3100";
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (!code || !state) return NextResponse.redirect(`${appUrl}/login?error=oauth_gagal`);

  const savedState = await readAndClearOAuthState();
  if (!state || !savedState || state !== savedState) {
    log("warn", "google.state_mismatch");
    return NextResponse.redirect(`${appUrl}/login?error=oauth_state`);
  }

  const profile = await exchangeCode(code);
  if (!profile) return NextResponse.redirect(`${appUrl}/login?error=oauth_gagal`);

  const user = await upsertGoogleUser(profile);
  if (!user) return NextResponse.redirect(`${appUrl}/login?error=oauth_email`);

  log("info", "google.login_sukses", { userId: user.id });
  const res = NextResponse.redirect(`${appUrl}/dashboard`);
  res.cookies.set(SESSION_COOKIE, createSession(user.id, user.role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}
