import Link from "next/link";

// Baris site di panel explorer kanan dashboard (F3: data asli dari Prisma).
// Ala file explorer IDE: ikon file, nama, slug, badge status, aksi inline.
export interface SiteCardData {
  id: string;
  title: string;
  slug: string;
  status: "PUBLISHED" | "DRAFT";
  updatedAt: string;
}

export function SiteCard({ site }: { site: SiteCardData }) {
  return (
    <article className="ide-row flex-col sm:flex-row sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="grid h-8 w-8 flex-shrink-0 place-items-center text-sm"
          style={{
            background: site.status === "PUBLISHED" ? "var(--accent-success)" : "var(--accent)",
            color: "var(--ink)",
            border: "2px solid var(--ink)",
            borderRadius: "var(--radius-sm)",
            fontWeight: 700,
          }}
        >
          {site.status === "PUBLISHED" ? "◆" : "○"}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {site.title}
          </h3>
          <p className="truncate text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            /{site.slug}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-shrink-0 items-center gap-2 sm:mt-0">
        <span className={`nb-badge ${site.status === "PUBLISHED" ? "nb-badge-mint" : "nb-badge-yellow"}`}>
          {site.status}
        </span>
        {/* TODO F4: arahkan ke /s/[slug] saat halaman publik siap */}
        <Link href={`/editor/${site.id}`} className="nb-btn nb-btn-primary px-3 py-1.5 text-xs">
          Edit
        </Link>
        <Link href={`/s/${site.slug}`} className="nb-btn nb-btn-ghost px-3 py-1.5 text-xs">
          Lihat
        </Link>
      </div>
    </article>
  );
}
