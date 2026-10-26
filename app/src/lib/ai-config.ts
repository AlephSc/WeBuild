// F10: helper config AI router — baca dari DB (runtime), fallback ke konstanta.
import { prisma } from "./prisma";
import { AI_PROVIDERS, type ProviderId } from "./ai-providers";

export type EffectiveProvider = {
  id: ProviderId;
  isEnabled: boolean;
  model: string;
};

// Daftar provider efektif: config DB override konstanta kode (model & enabled)
export async function getEffectiveProviders(): Promise<EffectiveProvider[]> {
  const configs = await prisma.aiProviderConfig.findMany().catch(() => []);
  return (Object.keys(AI_PROVIDERS) as ProviderId[]).map((id) => {
    const cfg = configs.find((c) => c.provider === id);
    return {
      id,
      isEnabled: cfg?.isEnabled ?? true, // default enabled kalau belum dikonfigurasi
      model: cfg?.model ?? AI_PROVIDERS[id].model,
    };
  });
}

// Kuota AI per plan — dari AppSetting, fallback default
const DEFAULT_QUOTA: Record<string, number> = { FREE: 10, PLUS: 50 };

export async function getAiQuota(plan: string): Promise<number> {
  const s = await prisma.appSetting.findUnique({ where: { key: `ai_quota_${plan}` } }).catch(() => null);
  if (s) {
    const n = parseInt(s.value, 10);
    if (!isNaN(n) && n >= 0) return n;
  }
  return DEFAULT_QUOTA[plan] ?? 10;
}
