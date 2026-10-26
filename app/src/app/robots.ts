import type { MetadataRoute } from "next";

// F6/SEO: robots — izinkan site user diindeks, blokir area app
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://webuild.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/s/",
        disallow: ["/api/", "/dashboard", "/editor/", "/login", "/register"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
