import { mockSites } from "@/lib/mock-sites";
import { SiteCard } from "@/components/dashboard/site-card";

export default function DashboardPage() {
  const sites = mockSites; // TODO F3: ganti mock dengan prisma site.findMany(userId)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      {/* Greeting + plan */}
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
          Halo, Budi
        </h1>
        <span className="nb-badge nb-badge-yellow">FREE</span>
        {/* TODO: badge plan dinamis dari session (FREE/PRO) */}
      </header>

      {/* Kartu AI-first utama */}
      <section
        className="nb-card flex flex-col gap-4 border-accent"
        style={{ borderWidth: "3px", background: "var(--surface2)" }}
      >
        <h2 className="text-xl font-bold sm:text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
          Bangun website baru dengan AI
        </h2>
        <div className="nb-field">
          <label htmlFor="ai-prompt">Prompt website</label>
          <textarea
            id="ai-prompt"
            rows={4}
            className="resize-y"
            placeholder="Ceritakan website yang kamu inginkan… contoh: website UMKM keripik pedas, ada katalog produk, harga, dan tombol order WhatsApp"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-md text-xs" style={{ color: "var(--muted)" }}>
            AI akan menyusun blok otomatis; kamu tinggal review &amp; edit.
          </p>
          {/* TODO F8: aktifkan setelah AI gateway siap */}
          <button type="button" className="nb-btn nb-btn-mint" disabled title="Aktif setelah AI gateway — F8">
            Generate Website
          </button>
        </div>
        <p className="text-xs">
          {/* Aksesibilitas: jalur manual untuk yang tidak ingin pakai AI */}
          <a href="/editor/new" className="underline" style={{ color: "var(--muted)" }}>
            Buat manual tanpa AI
          </a>
        </p>
      </section>

      {/* Daftar site */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Website Saya
        </h2>
        {sites.length === 0 ? (
          <div className="nb-card nb-dashed m-0 flex flex-col items-center gap-3 border-2 border-dashed border-muted p-8 text-center" style={{ borderStyle: "dashed" }}>
            <p className="font-semibold">Belum ada website</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Mulai dari prompt AI di atas, atau buat manual tanpa AI.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((s) => (
              <SiteCard key={s.id} site={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
