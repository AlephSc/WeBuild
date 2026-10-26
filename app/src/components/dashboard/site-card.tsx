import Link from "next/link";
import type { MockSite } from "@/lib/mock-sites";

// Kartu satu site di grid dashboard
// TODO F3: terima data site dari server component (Prisma), bukan mock
export function SiteCard({ site }: { site: MockSite }) {
  return (
    <article className="nb-card flex flex-col gap-3">
      {/* Thumbnail placeholder — TODO F4: ganti dengan screenshot/render asli site */}
      <div
        aria-hidden
        className="nb-radius-sm h-32 border-2 border-ink"
        style={{ background: "linear-gradient(135deg, #04101b 0%, #0c2433 60%, #16405c 100%)" }}
      />
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          {site.title}
        </h3>
        <span className={`nb-badge ${site.status === "PUBLISHED" ? "nb-badge-mint" : "nb-badge-yellow"}`}>
          {site.status}
        </span>
      </div>
      <p className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
        /{site.slug}
      </p>
      <div className="mt-auto flex gap-2">
        <Link href={`/editor/${site.id}`} className="nb-btn nb-btn-primary flex-1 text-sm">
          Edit
        </Link>
        {/* TODO F4: arahkan ke /s/[slug] saat halaman publik siap */}
        <Link href={`/editor/${site.id}`} className="nb-btn nb-btn-ghost flex-1 text-sm">
          Lihat
        </Link>
      </div>
    </article>
  );
}
