import Link from "next/link";
import type { Metadata } from "next";
import { PublicNav } from "@/components/nav";

export const metadata: Metadata = {
  title: "WeBuild — Ceritakan websitemu, AI yang membangun",
  description:
    "Jelaskan website impianmu dalam bahasa sehari-hari, AI menyusun blok dan kontennya. Publish dalam 90 detik, gratis.",
};

// Highlight ala mockup: kuning + border 2px + hard shadow + miring
function HL({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block"
      style={{
        background: "var(--accent)",
        color: "var(--ink)",
        padding: "0 10px",
        borderRadius: 8,
        border: "2px solid var(--ink)",
        boxShadow: "2px 2px 0 var(--shadow-hard)",
        transform: "rotate(-1deg)",
      }}
    >
      {children}
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 pb-16">
      <PublicNav />

      {/* ============ HERO ============ */}
      <section className="grid items-center gap-10 py-14 md:grid-cols-[1.1fr_.9fr]">
        <div>
          <span className="nb-badge nb-badge-yellow">AI-POWERED BUILDER</span>
          <h1 className="mt-5 mb-4 text-4xl sm:text-5xl md:text-[56px]">
            Ceritakan websitemu,
            <br />
            <HL>AI</HL> yang <HL>membangun.</HL>
          </h1>
          <p className="mb-7 max-w-[480px] text-muted">
            Jelaskan website impianmu — AI yang membangunnya. Tanpa drag-and-drop,
            tanpa ngoding. AI susun blok dan kontennya, kamu tinggal review dan
            publish.
          </p>

          {/* Demo prompt AI */}
          <div className="nb-field mb-3">
            <label htmlFor="demo-prompt">Contoh prompt untuk AI</label>
            <textarea
              id="demo-prompt"
              readOnly
              rows={3}
              aria-describedby="demo-caption"
              placeholder="contoh: website toko kopi susu gula aren, ada menu, foto, dan tombol WhatsApp"
            />
          </div>
          <Link href="/register" className="nb-btn nb-btn-primary w-full sm:w-auto">
            ⚡ Bangun dengan AI
          </Link>
          <p id="demo-caption" className="mt-3 text-sm text-muted">
            Gratis — tanpa kartu kredit
          </p>
        </div>

        {/* Simulasi flow AI di terminal */}
        <div aria-label="Simulasi proses AI membangun website">
          <div className="nb-terminal">
            <div className="nb-terminal-bar">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent-danger)" }} />
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent)" }} />
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent-success)" }} />
            </div>
            <div className="nb-terminal-body">
              <div>
                <span style={{ color: "var(--accent)" }}>➜ webuild</span> ai generate
              </div>
              <div style={{ color: "#5f7f8f" }}>01 PARSING memahami kebutuhan…</div>
              <div style={{ color: "#5f7f8f" }}>02 BLOCKS hero, text, gallery, contact</div>
              <div style={{ color: "#5f7f8f" }}>03 DONE 4 blok siap edit</div>
              <div style={{ color: "var(--accent-success)" }}>✔ siap publish dalam 90 detik</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section aria-label="Statistik platform" className="grid gap-4 sm:grid-cols-3">
        {[
          ["90 detik", "dari prompt ke publish"],
          ["6 tipe", "blok siap pakai"],
          ["Rp 0", "selamanya"],
        ].map(([num, lbl]) => (
          <div key={lbl} className="nb-card">
            <div
              className="text-4xl font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--accent-success)" }}
            >
              {num}
            </div>
            <div className="mt-1 text-xs uppercase tracking-wider text-muted">{lbl}</div>
          </div>
        ))}
      </section>

      {/* ============ CARA KERJANYA ============ */}
      <section className="mt-12">
        <h2 className="text-3xl">Cara kerjanya</h2>
        <p className="mt-2 text-muted">Dari cerita kamu sampai website online dalam empat langkah.</p>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["01", "Ceritakan kebutuhanmu", "Tulis dengan bahasa sehari-hari, seperti chat."],
            ["02", "AI susun blok & konten", "Struktur, teks, dan gambar dibuat otomatis."],
            ["03", "Kamu review & edit", "Ubah yang kurang pas lewat form sederhana."],
            ["04", "Publish sekali klik", "URL langsung bisa dibagikan."],
          ].map(([n, title, desc]) => (
            <li key={n} className="nb-card">
              <span
                className="mb-3 inline-block rounded-md px-2.5 py-1 text-sm font-semibold"
                style={{ background: "var(--ink)", color: "var(--accent)", fontFamily: "var(--font-mono)" }}
              >
                {n}
              </span>
              <h3 className="mb-1.5 text-lg">{title}</h3>
              <p className="text-sm text-muted">{desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="nb-dashed" />

      {/* ============ PRICING ============ */}
      <section>
        <h2 className="text-center text-3xl">Pilih plan kamu</h2>
        <div className="mx-auto mt-6 grid max-w-[760px] gap-6 md:grid-cols-2">
          {/* FREE */}
          <div className="nb-card">
            <span className="nb-badge nb-badge-yellow">FREE</span>
            <div
              className="my-3 text-4xl font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--accent)" }}
            >
              Rp 0 <span className="text-base font-normal text-muted">/selamanya</span>
            </div>
            <ul className="my-4 list-none p-0">
              {[
                ["✔", "1 website aktif", true],
                ["✔", "10 AI generate / hari", true],
                ["✔", "Upload 50 MB", true],
                ["✘", 'Badge "Dibuat dengan WeBuild" di footer', false],
              ].map(([icon, text, ok]) => (
                <li key={text as string} className="flex items-center gap-2.5 py-1.5 text-[15px]">
                  <span
                    aria-hidden
                    className="font-bold"
                    style={{ color: ok ? "var(--accent-success)" : "var(--accent-danger)" }}
                  >
                    {icon}
                  </span>
                  <span className="sr-only">{ok ? "Termasuk:" : "Tidak termasuk:"}</span>
                  {text}
                </li>
              ))}
            </ul>
            <Link href="/register" className="nb-btn nb-btn-ghost">
              Mulai Gratis
            </Link>
          </div>

          {/* PLUS */}
          <div
            className="nb-card"
            style={{ background: "var(--surface2)", outline: "2px solid var(--accent)", outlineOffset: 4 }}
          >
            <span className="nb-badge nb-badge-mint">PLUS</span>
            <div
              className="my-3 text-4xl font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--accent-success)" }}
            >
              Rp 25rb <span className="text-base font-normal text-muted">/bulan</span>
            </div>
            <ul className="my-4 list-none p-0">
              {["10 website aktif", "50 AI generate / hari", "Upload 500 MB", "Deploy ke GitHub"].map((t) => (
                <li key={t} className="flex items-center gap-2.5 py-1.5 text-[15px]">
                  <span aria-hidden className="font-bold" style={{ color: "var(--accent-success)" }}>
                    ✔
                  </span>
                  <span className="sr-only">Termasuk:</span>
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/register" className="nb-btn nb-btn-mint">
              Upgrade ke Plus
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="mt-14 border-t-2 pt-6 text-center text-sm text-muted" style={{ borderColor: "rgba(40,80,100,.53)" }}>
        © WeBuild 2026 · untuk tugas UKK
      </footer>
    </div>
  );
}
