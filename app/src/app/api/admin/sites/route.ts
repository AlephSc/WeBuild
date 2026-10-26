import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

// F9/F10: GET /api/admin/sites — daftar semua site (untuk moderasi)
export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const sites = await prisma.site.findMany({
    orderBy: { updatedAt: "desc" },
    include: { owner: { select: { email: true } } },
    take: 100,
  });

  return NextResponse.json({
    ok: true,
    sites: sites.map((s) => ({
      id: s.id, title: s.title, slug: s.slug,
      owner: s.owner.email,
      isPublished: !!s.publishedAt,
      version: s.version,
      updatedAt: s.updatedAt.toISOString(),
    })),
  });
}
