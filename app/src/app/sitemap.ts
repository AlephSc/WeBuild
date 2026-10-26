import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// F6/SEO: sitemap dinamis dari site published
// (cache: revalidatePath dipanggil publish API; tanpa segment config — Next 16 Cache Components)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let sites: { slug: string; updatedAt: Date }[] = [];
  try {
    sites = await prisma.site.findMany({
      where: { publishedAt: { not: null } },
      select: { slug: true, updatedAt: true },
      take: 500,
    });
  } catch {
    // DB cold/unavailable → sitemap kosong, jangan crash
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://webuild.vercel.app";
  return [
    ...sites.map((s) => ({
      url: `${base}/s/${s.slug}`,
      lastModified: s.updatedAt,
    })),
  ];
}
