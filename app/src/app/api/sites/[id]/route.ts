import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { log } from "@/lib/log";
import { validateBlocks } from "@/lib/site-utils";

type Ctx = { params: Promise<{ id: string }> };

// Helper ownership (PRD F3: user B edit site user A → 403)
async function getOwnedSite(id: string, uid: string) {
  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) return { error: NextResponse.json({ ok: false, error: "Site tidak ditemukan" }, { status: 404 }) };
  if (site.ownerId !== uid)
    return { error: NextResponse.json({ ok: false, error: "Bukan site milikmu" }, { status: 403 }) };
  return { site };
}

// GET /api/sites/:id — detail + draft blocks
export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getAuthUser();
  if (!session) return NextResponse.json({ ok: false, error: "Tidak terautentikasi" }, { status: 401 });
  const { id } = await ctx.params;
  const r = await getOwnedSite(id, session.uid);
  if (r.error) return r.error;
  return NextResponse.json({
    ok: true,
    site: {
      id: r.site.id, title: r.site.title, slug: r.site.slug,
      blocks: r.site.draftSnapshot, template: r.site.template,
      status: r.site.publishedAt ? "PUBLISHED" : "DRAFT",
      version: r.site.version, updatedAt: r.site.updatedAt.toISOString(),
    },
  });
}

// PUT /api/sites/:id — update draft blocks &/atau judul
export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getAuthUser();
  if (!session) return NextResponse.json({ ok: false, error: "Tidak terautentikasi" }, { status: 401 });
  const { id } = await ctx.params;
  const r = await getOwnedSite(id, session.uid);
  if (r.error) return r.error;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "Body tidak valid" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") {
    if (body.title.length < 2 || body.title.length > 80)
      return NextResponse.json({ ok: false, error: "Judul 2-80 karakter." }, { status: 400 });
    data.title = body.title;
  }
  if (body.blocks !== undefined) {
    const v = validateBlocks(body.blocks);
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
    data.draftSnapshot = v.blocks;
  }

  const site = await prisma.site.update({ where: { id }, data });
  log("info", "site updated", { userId: session.uid, siteId: id });
  return NextResponse.json({ ok: true, updatedAt: site.updatedAt.toISOString() });
}

// DELETE /api/sites/:id
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getAuthUser();
  if (!session) return NextResponse.json({ ok: false, error: "Tidak terautentikasi" }, { status: 401 });
  const { id } = await ctx.params;
  const r = await getOwnedSite(id, session.uid);
  if (r.error) return r.error;

  await prisma.site.delete({ where: { id } });
  log("info", "site deleted", { userId: session.uid, siteId: id });
  return NextResponse.json({ ok: true });
}
