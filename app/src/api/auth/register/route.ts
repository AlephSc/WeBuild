import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/log";
import { hashPassword, createSession, SESSION_COOKIE } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(60, "Nama maksimal 60 karakter"),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  tos: z.literal(true, { message: "Anda harus menyetujui Syarat & Privasi" }),
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
    log("warn", "register.validasi_gagal", { fields: Object.keys(errors) });
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    log("warn", "register.email_duplikat", { email });
    return NextResponse.json(
      { ok: false, errors: { email: "Email sudah terdaftar" } },
      { status: 400 },
    );
  }

  // Plan FREE — upsert idempoten agar register pertama di env baru tetap jalan
  const plan = await prisma.plan.upsert({
    where: { name: "FREE" },
    update: {},
    create: { name: "FREE", limits: { sites: 1, aiPerDay: 10, uploadMb: 50, fileMb: 2, revisions: 5 } },
  });

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      planId: plan.id,
      tosAcceptedAt: new Date(),
    },
    select: { id: true, role: true },
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSession(user.id, user.role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  log("info", "register.sukses", { userId: user.id, durationMs: Date.now() - t0 });
  return res;
}
