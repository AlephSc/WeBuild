import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// F10: guard endpoint admin — cek session + role ADMIN dari DB (bukan cuma token)
export async function requireAdmin(): Promise<{ uid: string } | NextResponse> {
  const session = await getAuthUser();
  if (!session) return NextResponse.json({ ok: false, error: "Tidak terautentikasi" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.uid }, select: { role: true, isActive: true, id: true } });
  if (!user || !user.isActive) return NextResponse.json({ ok: false, error: "Akun tidak aktif" }, { status: 403 });
  if (user.role !== "ADMIN") return NextResponse.json({ ok: false, error: "Khusus admin" }, { status: 403 });
  return { uid: user.id };
}
