import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

// F9: GET /api/admin/export?type=sites|users|ai_usage — CSV export (gate: terbuka di Excel)
function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "kosong\n";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n") + "\n";
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const type = req.nextUrl.searchParams.get("type") ?? "sites";
  let rows: Record<string, unknown>[] = [];

  if (type === "users") {
    const users = await prisma.user.findMany({ include: { plan: true, _count: { select: { sites: true } } } });
    rows = users.map((u) => ({ email: u.email, name: u.name, role: u.role, plan: u.plan?.name, sites: u._count.sites, active: u.isActive, daftar: u.createdAt.toISOString() }));
  } else if (type === "ai_usage") {
    const logs = await prisma.aiUsageLog.findMany({ orderBy: { createdAt: "desc" }, take: 5000, include: { user: { select: { email: true } } } });
    rows = logs.map((l) => ({ waktu: l.createdAt.toISOString(), user: l.user.email, provider: l.provider, tokensIn: l.tokensIn, tokensOut: l.tokensOut, status: l.status }));
  } else {
    const sites = await prisma.site.findMany({ include: { owner: { select: { email: true } } } });
    rows = sites.map((s) => ({ judul: s.title, slug: s.slug, owner: s.owner.email, published: !!s.publishedAt, versi: s.version, dibuat: s.createdAt.toISOString(), update: s.updatedAt.toISOString() }));
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="webuild_${type}.csv"`,
    },
  });
}
