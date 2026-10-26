import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { AI_PROVIDERS, type ProviderId } from "@/lib/ai-providers";
import { log } from "@/lib/log";

// F10: GET/PUT /api/admin/ai-config — konfigurasi AI router (runtime)
const VALID: ProviderId[] = Object.keys(AI_PROVIDERS) as ProviderId[];

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  let configs = await prisma.aiProviderConfig.findMany();
  // seed config default untuk provider yang belum ada
  for (const id of VALID) {
    if (!configs.some((c) => c.provider === id)) {
      await prisma.aiProviderConfig.create({
        data: { provider: id, isEnabled: true, model: AI_PROVIDERS[id].model },
      });
    }
  }
  configs = await prisma.aiProviderConfig.findMany();
  const quotas = await prisma.appSetting.findMany({ where: { key: { startsWith: "ai_quota_" } } });

  return NextResponse.json({
    ok: true,
    providers: VALID.map((id) => {
      const c = configs.find((x) => x.provider === id);
      return {
        id,
        label: AI_PROVIDERS[id].label,
        isEnabled: c?.isEnabled ?? true,
        model: c?.model ?? AI_PROVIDERS[id].model,
        hasKey: !!process.env[AI_PROVIDERS[id].envKey],
      };
    }),
    quotas: {
      FREE: quotas.find((q) => q.key === "ai_quota_FREE")?.value ?? "10",
      PLUS: quotas.find((q) => q.key === "ai_quota_PLUS")?.value ?? "50",
    },
  });
}

const PutSchema = {
  // divalidasi manual di handler (zod inline)
};

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ ok: false, error: "Body tidak valid" }, { status: 400 });

  const b = body as {
    providers?: { id: string; isEnabled?: boolean; model?: string }[];
    quotas?: { FREE?: string; PLUS?: string };
  };

  // update provider configs
  for (const p of b.providers ?? []) {
    if (!VALID.includes(p.id as ProviderId)) continue;
    const data: { isEnabled?: boolean; model?: string } = {};
    if (typeof p.isEnabled === "boolean") data.isEnabled = p.isEnabled;
    if (typeof p.model === "string" && p.model.trim()) data.model = p.model.trim();
    if (Object.keys(data).length === 0) continue;
    await prisma.aiProviderConfig.upsert({
      where: { provider: p.id },
      create: { provider: p.id, isEnabled: data.isEnabled ?? true, model: data.model ?? AI_PROVIDERS[p.id as ProviderId].model },
      update: data,
    });
    log("info", "ai config updated", { admin: guard.uid, provider: p.id, ...data });
  }

  // update quotas
  for (const plan of ["FREE", "PLUS"] as const) {
    const v = b.quotas?.[plan];
    if (v === undefined) continue;
    const n = parseInt(v, 10);
    if (isNaN(n) || n < 0 || n > 10000) continue;
    await prisma.appSetting.upsert({
      where: { key: `ai_quota_${plan}` },
      create: { key: `ai_quota_${plan}`, value: String(n) },
      update: { value: String(n) },
    });
    log("info", "ai quota updated", { admin: guard.uid, plan, value: n });
  }

  return NextResponse.json({ ok: true });
}
