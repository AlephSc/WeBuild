import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/log";
import { validateBlocks, type Block } from "@/lib/site-utils";
import { sanitizeSiteText } from "@/lib/sanitize";
import BlockRenderer from "@/components/blocks/renderer";

// F6: Halaman publik — hanya render publishedSnapshot (D5: draft tidak pernah bocor).
// Di-cache via revalidateTag/publish API; unknown slug → 404.

type Props = { params: Promise<{ slug: string }> };

async function getPublishedSite(slug: string) {
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site || !site.publishedAt || !site.publishedSnapshot) return null;
  return { site, blocks: site.publishedSnapshot as unknown as Block[] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublishedSite(slug);
  if (!data) return { title: "Situs tidak ditemukan — WeBuild" };
  const { blocks } = data;
  const hero = blocks.find((b) => b.type === "hero") as { data: { heading?: string; subheading?: string } } | undefined;
  const text = blocks.find((b) => b.type === "text") as { data: { body?: string } } | undefined;
  const image = blocks.find((b) => b.type === "image") as { data: { url?: string } } | undefined;
  const gallery = blocks.find((b) => b.type === "gallery") as { data: { images?: { url: string }[] } } | undefined;
  const title = sanitizeSiteText(hero?.data?.heading ?? data.site.title);
  const description = sanitizeSiteText(
    (hero?.data?.subheading || text?.data?.body || "Website buatan WeBuild").slice(0, 155)
  );
  const ogImage = image?.data?.url ?? gallery?.data?.images?.[0]?.url ?? undefined;
  return {
    title: `${title} — WeBuild`,
    description,
    openGraph: { title, description, images: ogImage ? [ogImage] : undefined },
    robots: { index: true, follow: true },
  };
}

export default async function PublishedSitePage({ params }: Props) {
  const { slug } = await params;
  const data = await getPublishedSite(slug);
  if (!data) notFound();

  const v = validateBlocks(data.blocks);
  const blocks = v.ok ? v.blocks : [];
  if (!v.ok) log("warn", "published site invalid blocks", { slug });

  // Sanitize semua teks user sebelum render (anti stored-XSS — PRD F6)
  const safeBlocks = blocks.map((b) => ({
    ...b,
    data: sanitizeBlockData(b),
  })) as Block[];

  return (
    <div className="site-root" style={{ minHeight: "100vh" }}>
      <main>
        {safeBlocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </main>
      <footer
        style={{
          borderTop: "2px solid #061421",
          padding: "0.875rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          background: "#FCEFCB",
          fontSize: 12,
        }}
      >
        <span>
          Dibuat dengan <strong>WeBuild</strong> · bikin website gratis di webuild.vercel.app
        </span>
        <ReportButton slug={slug} />
      </footer>
    </div>
  );
}

// F9: tombol Laporkan — client component kecil (fetch POST)
function ReportButton({ slug }: { slug: string }) {
  return (
    <button
      type="button"
      style={{
        border: "2px solid #061421", background: "#fff", borderRadius: 8,
        padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer",
        boxShadow: "2px 2px 0 #061421",
      }}
      onClick={async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.textContent = "Mengirim…";
        try {
          const res = await fetch("/api/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
          });
          const data = await res.json();
          btn.textContent = data.ok ? "✔ Terkirim" : (data.error ?? "Gagal");
        } catch {
          btn.textContent = "Gagal kirim";
        }
      }}
    >
      ⚠ Laporkan
    </button>
  );
}

// Sanitasi per tipe blok: semua string field dikasih DOMPurify (server-side)
function sanitizeBlockData(block: Block): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(block.data as Record<string, unknown>)) {
    if (typeof val === "string") out[k] = sanitizeSiteText(val);
    else if (Array.isArray(val))
      out[k] = val.map((item) =>
        typeof item === "string" ? sanitizeSiteText(item) : item && typeof item === "object"
          ? Object.fromEntries(Object.entries(item).map(([ik, iv]) => [ik, typeof iv === "string" ? sanitizeSiteText(iv) : iv]))
          : item
      );
    else out[k] = val;
  }
  return out;
}
