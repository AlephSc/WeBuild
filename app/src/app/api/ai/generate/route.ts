import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { log } from "@/lib/log";
import { generateBlocksWithAI } from "@/lib/ai-gateway";
import { validateBlocks } from "@/lib/site-utils";
import { getEffectiveProviders, getAiQuota } from "@/lib/ai-config";

// F8: POST /api/ai/generate
// Pipeline: verify → kuota atomik (SQL UPDATE ... WHERE) → generate (config runtime F10) → validasi → log
// Race-proof: 2 request paralel saat sisa 1 → tepat SATU lolos (PRD F8).

const BodySchema = z.object({
  instruction: z.string().min(5).max(1000),
  siteId: z.string().uuid().optional(),
});

// Satu UPDATE atomic: hari sama → +1 hanya jika < limit; hari beda → reset ke 1.
// Postgres meng-serialisasi UPDATE baris sama → race paralel aman.
async function acquireQuota(userId: string, today: Date, limit: number): Promise<number> {
  return prisma.$executeRawUnsafe(
    `UPDATE "AiPermission"
     SET "quotaUsed" = CASE WHEN "quotaDate" = $2::timestamp THEN "quotaUsed" + 1 ELSE 1 END,
         "quotaDate" = $2::timestamp
     WHERE "userId" = $1::uuid
       AND (CASE WHEN "quotaDate" = $2::timestamp THEN "quotaUsed" ELSE 0 END) < $3`,
    userId, today, limit
  );
}

export async function POST(req: NextRequest) {
  const started = Date.now();
  const session = await getAuthUser();
  if (!session) return NextResponse.json({ ok: false, error: "Tidak terautentikasi" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "Instruksi minimal 5 karakter." }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    include: { plan: true, aiPermissions: true },
  });
  if (!user || !user.isActive) return NextResponse.json({ ok: false, error: "Akun tidak aktif" }, { status: 403 });
  const aiPerm = user.aiPermissions[0];
  if (aiPerm && !aiPerm.canUseAi)
    return NextResponse.json({ ok: false, error: "Akses AI kamu dinonaktifkan admin." }, { status: 403 });

  const planName = user.plan?.name ?? "FREE";
  const limit = await getAiQuota(planName);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  // ===== KUOTA ATOMIK =====
  let acquired = await acquireQuota(user.id, today, limit);
  if (acquired === 0) {
    // record belum ada → insert lalu acquire ulang
    await prisma.$executeRawUnsafe(
      `INSERT INTO "AiPermission" ("id", "userId", "canUseAi", "quotaUsed", "quotaDate", "updatedAt")
       VALUES (gen_random_uuid(), $1::uuid, true, 0, $2::timestamp, now())
       ON CONFLICT ("userId") DO NOTHING`,
      user.id, today
    );
    acquired = await acquireQuota(user.id, today, limit);
  }
  if (acquired === 0) {
    const perm = await prisma.aiPermission.findUnique({ where: { userId: user.id } });
    const sisa = perm && perm.quotaDate.getTime() === today.getTime() ? limit - perm.quotaUsed : limit;
    return NextResponse.json(
      { ok: false, error: `Kuota AI hari ini habis (${limit}x untuk paket ${user.plan?.name ?? "FREE"}). Kembali besok!`, code: "QUOTA_EXHAUSTED", sisa },
      { status: 429 }
    );
  }

  // ===== GENERATE (F10: providers dari config runtime) =====
  const providers = await getEffectiveProviders();
  const result = await generateBlocksWithAI(parsed.data.instruction, providers);

  // log pemakaian (telemetri — PRD F8 & bahan laporan F10)
  await prisma.aiUsageLog.create({
    data: {
      userId: user.id,
      provider: result.ok ? result.provider : "none",
      tokensIn: result.ok ? result.tokens.in : Math.ceil(parsed.data.instruction.length / 4),
      tokensOut: result.ok ? result.tokens.out : 0,
      status: result.ok ? "success" : result.code,
    },
  }).catch((e) => log("error", "usage log gagal", { err: String(e).slice(0, 80) }));

  if (!result.ok) {
    // rollback kuota: jangan tagih request yang gagal
    await prisma.aiPermission.update({
      where: { userId: user.id },
      data: { quotaUsed: { decrement: 1 } },
    }).catch(() => {});
    return NextResponse.json({ ok: false, error: result.error }, { status: 503 });
  }

  // validasi akhir via registry
  const v = validateBlocks(result.blocks);
  if (!v.ok) {
    return NextResponse.json({ ok: false, error: "AI menghasilkan blok tidak valid — coba ulangi." }, { status: 503 });
  }

  log("info", "ai generate ok", { userId: user.id, provider: result.provider, durationMs: Date.now() - started });
  return NextResponse.json({ ok: true, blocks: v.blocks, provider: result.provider });
}
