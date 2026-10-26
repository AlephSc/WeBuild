import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { log } from "@/lib/log";
import { revalidatePath } from "next/cache";

// F9: POST /api/admin/sites/:id/unpublish — takedown (notice & takedown flow)
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { id } = await ctx.params;
  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) return NextResponse.json({ ok: false, error: "Site tidak ditemukan" }, { status: 404 });

  await prisma.site.update({
    where: { id },
    data: { publishedSnapshot: undefined, publishedAt: null },
  });

  // cache invalidate → /s/slug jadi 404 segera
  revalidatePath(`/s/${site.slug}`);
  revalidatePath("/sitemap.xml");

  log("info", "site unpublished by admin", { admin: guard.uid, siteId: id, slug: site.slug });
  return NextResponse.json({ ok: true });
}

// GET /api/admin/sites — daftar semua site (untuk moderasi)
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
