import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { log } from "@/lib/log";
import { validateBlocks } from "@/lib/site-utils";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/sites/:id/publish — PRD F6: momen terbesar
// Validasi (alt wajib) → copy draft→published_snapshot → version+1 → revision → revalidate
const MAX_REVISIONS = 10;

export async function POST(_req: NextRequest, ctx: Ctx) {
  const session = await getAuthUser();
  if (!session) return NextResponse.json({ ok: false, error: "Tidak terautentikasi" }, { status: 401 });

  const { id } = await ctx.params;
  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) return NextResponse.json({ ok: false, error: "Site tidak ditemukan" }, { status: 404 });
  if (site.ownerId !== session.uid)
    return NextResponse.json({ ok: false, error: "Bukan site milikmu" }, { status: 403 });

  // Validasi blok sebelum publish (a11y: alt text wajib di semua image)
  const v = validateBlocks(site.draftSnapshot);
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error, code: "INVALID_BLOCKS" }, { status: 400 });

  const newVersion = site.version + 1;

  await prisma.$transaction(async (tx) => {
    // Simpan revisi (cap 10 — FIFO)
    if (site.publishedSnapshot) {
      await tx.siteRevision.create({
        data: { siteId: site.id, version: site.version, snapshot: (site.publishedSnapshot ?? {}) as object },
      });
      // hapus revisi terlama jika melebihi cap
      const revs = await tx.siteRevision.findMany({
        where: { siteId: site.id },
        orderBy: { version: "desc" },
        select: { id: true },
      });
      if (revs.length > MAX_REVISIONS) {
        await tx.siteRevision.deleteMany({
          where: { siteId: site.id, id: { in: revs.slice(MAX_REVISIONS).map((r) => r.id) } },
        });
      }
    }
    // Publish: draft → published_snapshot, version+1
    await tx.site.update({
      where: { id: site.id },
      data: { publishedSnapshot: site.draftSnapshot as object, version: newVersion, publishedAt: new Date() },
    });
  });

  // Refresh cache halaman publik (D5: published terpisah, cache invalid saat publish)
  revalidatePath(`/s/${site.slug}`);
  revalidatePath("/sitemap.xml");

  log("info", "site published", { userId: session.uid, siteId: site.id, slug: site.slug, version: newVersion });
  return NextResponse.json({ ok: true, url: `/s/${site.slug}`, version: newVersion });
}
