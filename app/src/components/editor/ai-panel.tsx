"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import type { Block } from "@/lib/blocks";
import BlockRenderer from "@/components/blocks/renderer";

// F8: AI panel — POST /api/ai/generate → pratinjau blocks → tombol Pakai (replace semua blok).
// Sesuai PRD: hasil tampil dulu sebagai PRATINJAU, tidak auto-overwrite.

export default function AiPanel() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const setBlocks = useEditorStore((s) => s.setBlocks);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selected = blocks.find((b) => b.id === selectedId);

  const [instruksi, setInstruksi] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<Block[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sisa, setSisa] = useState<number | null>(null);

  async function generate() {
    if (!instruksi.trim() || loading) return;
    setLoading(true);
    setHasil(null);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: instruksi.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "AI gagal — coba lagi.");
        setSisa(typeof data.sisa === "number" ? data.sisa : null);
        return;
      }
      setHasil(data.blocks);
    } catch {
      setError("Koneksi bermasalah.");
    } finally {
      setLoading(false);
    }
  }

  function pakai() {
    if (!hasil) return;
    // replace seluruh halaman dengan hasil AI (lalu user bisa edit manual)
    setBlocks(hasil);
    selectBlock(hasil[0]?.id ?? null);
    setHasil(null);
  }

  function pakaiDiBlok() {
    if (!hasil || !selected || hasil.length === 0) return;
    // alternatif: terapkan blok AI pertama yang tipe sama dengan blok terpilih
    const match = hasil.find((b) => b.type === selected.type) ?? hasil[0];
    updateBlock(selected.id, match.data);
    setHasil(null);
  }

  return (
    <section className="nb-card" style={{ borderColor: "var(--accent)", borderWidth: 3 }}>
      <div className="flex items-center justify-between">
        <h2 className="font-bold">✨ Asisten AI</h2>
        {sisa !== null && (
          <span className="nb-terminal text-sm" style={{ color: "var(--muted)" }}>
            sisa {sisa}/10 hari ini
          </span>
        )}
      </div>

      <textarea
        className="nb-field mt-3 min-h-20 w-full"
        placeholder="Contoh: website UMKM keripik pedas, ada katalog produk, harga, dan tombol order WhatsApp"
        value={instruksi}
        onChange={(e) => setInstruksi(e.target.value)}
        maxLength={1000}
      />

      <button className="nb-btn nb-btn-primary mt-2 w-full" onClick={generate} disabled={loading || !instruksi.trim()}>
        {loading ? "✨ AI sedang menyusun…" : "Generate Konten"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-sm" style={{ color: "var(--accent-danger)" }}>
          {error}
        </p>
      )}

      {hasil && (
        <div className="nb-dashed mt-3 p-3">
          <p className="mb-2 text-xs" style={{ color: "var(--muted)" }}>
            Pratinjau {hasil.length} blok hasil AI — belum tersimpan. Pilih cara pakai:
          </p>
          {/* pratinjau mini versi terang */}
          <div className="site-root max-h-64 overflow-y-auto nb-radius-sm p-2" style={{ border: "2px solid var(--ink)" }}>
            {hasil.slice(0, 3).map((b) => (
              <BlockRenderer key={b.id} block={b} />
            ))}
            {hasil.length > 3 && (
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                +{hasil.length - 3} blok lagi…
              </p>
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <button className="nb-btn nb-btn-mint flex-1" onClick={pakai} title="Ganti seluruh halaman dengan hasil AI">
              ✔ Pakai Semua
            </button>
            <button
              className="nb-btn nb-btn-ghost flex-1"
              onClick={pakaiDiBlok}
              disabled={!selected}
              title={selected ? `Terapkan ke blok ${selected.type} terpilih` : "Pilih blok dulu"}
            >
              → Ke Blok Terpilih
            </button>
            <button className="nb-btn nb-btn-ghost" onClick={generate} title="Generate ulang">
              ↻
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
