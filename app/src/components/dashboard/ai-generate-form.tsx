"use client";

// F8: form AI-first di dashboard — generate blocks via /api/ai/generate
// → buat site baru dengan hasil AI → langsung ke editor untuk review.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithCsrf } from "@/lib/fetch-with-csrf";
import { pushIdeRiwayat } from "./ide-chrome";

export function AiGenerateForm({ canCreate }: { canCreate: boolean }) {
  const router = useRouter();
  const [instruksi, setInstruksi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!instruksi.trim() || loading) return;
    if (!canCreate) {
      setError("Paket FREE maksimal 1 website — hapus yang lama atau upgrade.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. generate blocks via AI
      const res = await fetchWithCsrf("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: instruksi.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "AI gagal — coba lagi.");
        return;
      }
      pushIdeRiwayat(instruksi.trim());
      // 2. buat site dengan judul dari instruksi + blocks AI
      const judul = instruksi.trim().split(/[.,\n]/)[0].slice(0, 60) || "Website Baru";
      const res2 = await fetchWithCsrf("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: judul, blocks: data.blocks }),
      });
      const d2 = await res2.json();
      if (!res2.ok) {
        setError(d2.error ?? "Gagal membuat website.");
        return;
      }
      // 3. langsung ke editor untuk review & edit
      router.push(`/editor/${d2.site.id}`);
    } catch {
      setError("Koneksi bermasalah.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="nb-field">
        <label htmlFor="ai-prompt">Prompt website</label>
        <textarea
          id="ai-prompt"
          rows={4}
          className="resize-y"
          placeholder="Ceritakan website yang kamu inginkan… contoh: website UMKM keripik pedas, ada katalog produk, harga, dan tombol order WhatsApp"
          value={instruksi}
          onChange={(e) => setInstruksi(e.target.value)}
          maxLength={1000}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-xs" style={{ color: "var(--muted)" }}>
          AI akan menyusun blok otomatis; kamu tinggal review &amp; edit.
        </p>
        <button type="button" className="nb-btn nb-btn-mint" onClick={generate} disabled={loading || !instruksi.trim()}>
          {loading ? "✨ AI sedang membangun…" : "✨ Generate Website"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm" style={{ color: "var(--accent-danger)" }}>
          {error}
        </p>
      )}
    </>
  );
}
