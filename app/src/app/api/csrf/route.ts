import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CSRF_COOKIE, generateCsrfToken } from "@/lib/csrf";

// GET /api/csrf — terbitkan CSRF token (double-submit cookie).
// Dipanggil sekali per session browser oleh client (fetch-with-csrf.ts).
export async function GET(_req: NextRequest) {
  const token = await generateCsrfToken();
  const res = NextResponse.json({ ok: true, token });
  res.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false, // harus terbaca JS client (double-submit pattern)
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24 jam
    path: "/",
  });
  return res;
}
