import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

// F9/F10: GET /api/admin/stats — 4 metrik + trend (rasio, bukan angka mentah)
export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const [usersTotal, sitesTotal, published, aiLogs, events] = await Promise.all([
    prisma.user.count(),
    prisma.site.count(),
    prisma.site.count({ where: { publishedAt: { not: null } } }),
    prisma.aiUsageLog.findMany({ select: { status: true, tokensIn: true, tokensOut: true }, take: 5000 }),
    prisma.siteEvent.count(),
  ]);

  const aiSuccess = aiLogs.filter((l) => l.status === "success").length;
  const tokensTotal = aiLogs.reduce((a, l) => a + l.tokensIn + l.tokensOut, 0);

  return NextResponse.json({
    ok: true,
    stats: {
      usersTotal,
      sitesTotal,
      publishRate: sitesTotal > 0 ? Math.round((published / sitesTotal) * 100) : 0,
      published,
      aiRequests: aiLogs.length,
      aiSuccessRate: aiLogs.length > 0 ? Math.round((aiSuccess / aiLogs.length) * 100) : 0,
      tokensTotal,
      siteEvents: events,
    },
  });
}
