import { NextResponse } from "next/server";
import { buildAuthUrl, googleConfigured, setOAuthState } from "@/lib/google-auth";
import { log } from "@/lib/log";

// GET /api/auth/google — mulai flow OAuth: redirect ke Google
export async function GET() {
  if (!googleConfigured()) {
    log("warn", "google.belum_dikonfigurasi");
    return NextResponse.redirect(new URL("/login?error=google_belum_konfigurasi", process.env.APP_URL || "http://localhost:3100"));
  }
  const { url, state } = buildAuthUrl();
  await setOAuthState(state);
  return NextResponse.redirect(url);
}
