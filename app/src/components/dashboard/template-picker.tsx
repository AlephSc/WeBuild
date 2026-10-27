"use client";

// F11: picker template — grid kartu template, klik = buat site langsung.
import { useState } from "react";
import { useRouter } from "next/navigation";

type Tpl = { id: string; name: string; emoji: string; description: string };

const TEMPLATES: Tpl[] = [
  { id: "kopi-senja", name: "Kedai Kopi", emoji: "☕", description: "Hangat & personal, cocok UMKM F&B" },
  { id: "toko-umkm", name: "Toko Online", emoji: "🛍️", description: "Katalog produk + order WhatsApp" },
  { id: "portofolio", name: "Portofolio", emoji: "🎨", description: "Pamer karya & jasa profesional" },
  { id: "event-seminar", name: "Event / Seminar", emoji: "🎤", description: "Agenda acara & pendaftaran" },
  { id: "sekolah", name: "Sekolah / Kelas", emoji: "🎓", description: "Pengumuman & karya siswa" },
  { id: "jasa-freelance", name: "Jasa / Freelancer", emoji: "💼", description: "Layanan & harga transparan" },
];

export function TemplatePicker({ canCreate }: { canCreate: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function create(tplId: string) {
    if (loading) return;
    if (!canCreate) {
      setError("Paket FREE maksimal 1 website — hapus yang lama atau upgrade.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || TEMPLATES.find((t) => t.id === tplId)!.name, template: tplId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat website.");
        return;
      }
      router.push(`/editor/${data.site.id}`);
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="nb-field">
        <label htmlFor="tpl-title">Nama website</label>
        <input
          id="tpl-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="mis. Kopi Kenangan Senja"
          maxLength={80}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => create(t.id)}
            disabled={loading}
            className="nb-card m-0 flex flex-col gap-1 p-4 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            style={{ cursor: "pointer", borderWidth: "2px" }}
          >
            <span className="text-2xl" aria-hidden="true">{t.emoji}</span>
            <span className="font-bold" style={{ fontFamily: "var(--font-heading)" }}>{t.name}</span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>{t.description}</span>
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm" style={{ color: "var(--accent-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
