import type { NextConfig } from "next";
import { securityHeadersFor } from "./src/lib/security-headers";  // fallback headers

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Fallback security headers (proxy.ts adalah lapisan utama; config ini
  // menjamin header tetap ada untuk route yang tidak lewat middleware).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeadersFor("/").map(([key, value]) => ({ key, value })),
      },
    ];
  },
};

export default nextConfig;
