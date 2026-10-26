import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/log";
import { verifyPassword, createSession, SESSION_COOKIE } from "@/lib/auth";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errors: { _form: "Permintaan tidak valid" } }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, role: true, isActive: true },
  });
  const valid = user?.isActive && (await verifyPassword(password, user.passwordHash));

  if (!user || !valid) {
    log("warn", "login.gagal", { email }); // pesan generik — jangan bocorkan ada/tidaknya email
    return NextResponse.json(
      { ok: false, errors: { _form: "Email atau password salah" } },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSession(user.id, user.role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  log("info", "login.sukses", { userId: user.id, durationMs: Date.now() - t0 });
  return res;
}
