import { NextResponse } from "next/server";
import { log } from "@/lib/log";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // Hardened cookie clear: "" + maxAge 0 + expires epoch (kompatibel semua browser),
  // secure & __Host- precursor saat HTTPS.
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    expires: new Date(0),
    path: "/",
  });
  log("info", "logout.sukses");
  return res;
}
