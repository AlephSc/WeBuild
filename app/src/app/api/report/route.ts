import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse, clientIpFrom } from "@/lib/rate-limit";

// F9: POST /api/report — lapor konten dari tombol Laporkan di footer /s/slug
// Publik (tanpa login), rate-limit ringan: max 5 report per slug per jam via cek DB.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { slug?: string; reason?: string } | null;
  if (!body?.slug) return NextResponse.json({ ok: false, error: "slug wajib" }, { status: 400 });

  // Lapisan 1: rate limit per-IP (endpoint publik, tanpa login) — 10 report / jam / IP
  const rl = rateLimit({ key: "report-ip", id: clientIpFrom(req), limit: 10, windowMs: 60 * 60_000 });
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  const site = await prisma.site.findUnique({ where: { slug: body.slug } });
  if (!site) return NextResponse.json({ ok: false, error: "Site tidak ditemukan" }, { status: 404 });

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.siteEvent.count({
    where: { siteId: site.id, eventType: "report", createdAt: { gte: oneHourAgo } },
  });
  if (recent >= 5) return NextResponse.json({ ok: false, error: "Laporan untuk situs ini sudah tercatat. Terima kasih." }, { status: 429 });

  await prisma.siteEvent.create({
    data: { siteId: site.id, eventType: "report" },
  });

  return NextResponse.json({ ok: true, message: "Laporan terkirim. Terima kasih — tim kami akan meninjau." });
}
