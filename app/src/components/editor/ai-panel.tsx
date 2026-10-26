"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/editor-store";

// MOCK: generate konten client-side. TODO F8: ganti dengan POST /api/ai/generate
function mockGenerate(instruksi: string): Record<string, unknown> {
  const judul = instruksi.trim() || "Judul Situs";
  return {
    title: judul.slice(0, 60),
    subtitle: `${judul} — solusi terbaik untuk kebutuhan Anda. Mulai hari ini.`,
    body: `Kami membantu Anda mencapai tujuan dengan ${judul.toLowerCase()}. Hubungi kami untuk info lebih lanjut.`,
    ctaLabel: "Mulai Sekarang",
  };
}

export default function AiPanel() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selected = blocks.find((b) => b.id === selectedId);

  const [instruksi, setInstruksi] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<Record<string, unknown> | null>(null);

  // ponytail: kuota hard-coded; ganti dengan data user saat F6/F8
  const sisa = 7;

  function generate() {
    if (!instruksi.trim() || loading) return;
    setLoading(true);
    setHasil(null);
    setTimeout(() => {
      setHasil(mockGenerate(instruksi));
      setLoading(false);
    }, 900);
  }

  return (
    <section className="nb-card">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">✦ Asisten AI</h2>
        <span className="nb-terminal text-sm">sisa {sisa}/10 hari ini</span>
      </div>

      <textarea
        className="nb-field mt-3 min-h-20 w-full"
        placeholder="Contoh: buatkan hero untuk toko kue custom di Bandung"
        value={instruksi}
        onChange={(e) => setInstruksi(e.target.value)}
      />

      <button className="nb-btn nb-btn-primary mt-2 w-full" onClick={generate} disabled={loading || !instruksi.trim()}>
        {loading ? "Menghasilkan…" : "Generate Konten"}
      </button>

      {hasil && (
        <div className="nb-dashed mt-3 p-3 text-sm">
          <pre className="mb-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(hasil, null, 2)}</pre>
          <div className="flex gap-2">
            <button
              className="nb-btn nb-btn-mint flex-1"
              disabled={!selected}
              title={selected ? "Terapkan ke blok terpilih" : "Pilih blok dulu di daftar blok"}
              onClick={() => {
                if (selected) updateBlock(selected.id, hasil);
              }}
            >
              Pakai
            </button>
            <button className="nb-btn nb-btn-ghost flex-1" onClick={generate}>
              Ulangi
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
