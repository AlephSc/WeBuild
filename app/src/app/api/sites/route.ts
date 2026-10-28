import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { log } from "@/lib/log";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { SEED_TEMPLATE, SITE_TEMPLATES, slugify, validateBlocks } from "@/lib/site-utils";

// POST /api/sites — buat site baru (seed template otomatis, enforcement plan)
const BodySchema = z.object({
  title: z.string().min(2).max(80),
  template: z.string().max(40).optional(), // id dari SITE_TEMPLATES (F11)
  blocks: z.array(z.record(z.string(), z.unknown())).optional(), // kosong = template default
});

const PLAN_SITES: Record<string, number> = { FREE: 1, PLUS: 10 };

export async function POST(req: NextRequest) {
  const session = await getAuthUser();
  if (!session) return NextResponse.json({ ok: false, error: "Tidak terautentikasi" }, { status: 401 });

  // Rate limit: 10 site / 10 menit per user (plan cap tetap jadi batas utama; ini brake spam)
  const rl = rateLimit({ key: "site-create", id: session.uid, limit: 10, windowMs: 10 * 60_000 });
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  const user = await prisma.user.findUnique({ where: { id: session.uid }, include: { plan: true } });
  if (!user || !user.isActive) return NextResponse.json({ ok: false, error: "Akun tidak aktif" }, { status: 403 });

  // Enforcement plan (PRD F4): Free = 1 site
  const count = await prisma.site.count({ where: { ownerId: user.id } });
  const limit = PLAN_SITES[user.plan?.name ?? "FREE"] ?? 1;
  if (count >= limit) {
    return NextResponse.json(
      { ok: false, error: `Paket ${user.plan?.name ?? "FREE"} maksimal ${limit} website. Upgrade untuk lebih banyak.`, code: "PLAN_LIMIT" },
      { status: 402 }
    );
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { ok: false, errors: { title: "Judul 2-80 karakter." } },
      { status: 400 }
    );

  const chosen = parsed.data.template ? SITE_TEMPLATES.find((t: { id: string }) => t.id === parsed.data.template) : undefined;
  const seed = chosen ? chosen.blocks() : SEED_TEMPLATE;
  const blocks = parsed.data.blocks?.length ? validateBlocks(parsed.data.blocks) : { ok: true as const, blocks: seed as never[] };
  if (!blocks.ok) return NextResponse.json({ ok: false, error: (blocks as { error: string }).error }, { status: 400 });

  // slug unik global (D-review DB): bentrok → auto-suffix
  const base = slugify(parsed.data.title);
  const taken = new Set((await prisma.site.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } })).map((s) => s.slug));
  let slug = base;
  if (taken.has(slug)) slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

  const site = await prisma.site.create({
    data: {
      ownerId: user.id,
      title: parsed.data.title,
      slug,
      draftSnapshot: blocks.blocks,
    },
  });

  log("info", "site created", { userId: user.id, siteId: site.id, slug });
  return NextResponse.json({ ok: true, site: { id: site.id, title: site.title, slug: site.slug } }, { status: 201 });
}

// GET /api/sites — daftar site milik user login
export async function GET() {
  const session = await getAuthUser();
  if (!session) return NextResponse.json({ ok: false, error: "Tidak terautentikasi" }, { status: 401 });

  const sites = await prisma.site.findMany({
    where: { ownerId: session.uid },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, slug: true, publishedAt: true, updatedAt: true },
  });

  return NextResponse.json({
    ok: true,
    sites: sites.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      status: s.publishedAt ? "PUBLISHED" : "DRAFT",
      updatedAt: s.updatedAt.toISOString(),
    })),
  });
}
