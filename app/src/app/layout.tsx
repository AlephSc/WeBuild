import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "WeBuild — Bikin website dalam menit, tanpa ngoding",
  description:
    "Susun website kamu dari blok-blok siap pakai. Asisten AI bantu menulis konten. Publish sekali klik — gratis.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body
        className={`${grotesk.variable} ${inter.variable} ${mono.variable}`}
        style={{
          fontFamily: "var(--font-body)",
          background: "var(--bg)",
          color: "var(--fg)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
