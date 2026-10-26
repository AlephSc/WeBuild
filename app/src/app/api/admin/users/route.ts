import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { log } from "@/lib/log";
import { revalidatePath } from "next/cache";

// F10: GET /api/admin/users — daftar user + status AI + plan
export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { plan: true, aiPermissions: true, _count: { select: { sites: true } } },
  });

  return NextResponse.json({
    ok: true,
    users: users.map((u) => ({
      id: u.id, name: u.name, email: u.email, role: u.role,
      plan: u.plan?.name ?? "FREE", isActive: u.isActive,
      sitesCount: u._count.sites,
      canUseAi: u.aiPermissions[0]?.canUseAi ?? true,
      quotaUsed: u.aiPermissions[0]?.quotaUsed ?? 0,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}

// PATCH /api/admin/users — toggle isActive / canUseAi / plan
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const body = (await req.json().catch(() => null)) as
    | { userId?: string; isActive?: boolean; canUseAi?: boolean; plan?: "FREE" | "PLUS" }
    | null;
  if (!body?.userId) return NextResponse.json({ ok: false, error: "userId wajib" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: body.userId } });
  if (!user) return NextResponse.json({ ok: false, error: "User tidak ditemukan" }, { status: 404 });
  if (user.id === guard.uid) return NextResponse.json({ ok: false, error: "Tidak bisa mengubah diri sendiri" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (body.plan === "FREE" || body.plan === "PLUS") {
    const plan = await prisma.plan.upsert({
      where: { name: body.plan },
      create: {
        name: body.plan,
        limits: body.plan === "FREE"
          ? { sites: 1, aiPerDay: 10, uploadMb: 50, fileMb: 2, revisions: 5 }
          : { sites: 10, aiPerDay: 50, uploadMb: 500, fileMb: 5, revisions: 10 },
      },
      update: {},
    });
    data.planId = plan.id;
  }
  if (Object.keys(data).length > 0) {
    await prisma.user.update({ where: { id: user.id }, data });
  }

  if (typeof body.canUseAi === "boolean") {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    await prisma.aiPermission.upsert({
      where: { userId: user.id },
      create: { userId: user.id, canUseAi: body.canUseAi, quotaDate: today },
      update: { canUseAi: body.canUseAi },
    });
    log("info", "admin toggle AI access", { admin: guard.uid, target: user.email, canUseAi: body.canUseAi });
  }

  return NextResponse.json({ ok: true });
}
