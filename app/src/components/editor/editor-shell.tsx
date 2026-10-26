"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/nav";
import { SEED_TEMPLATE } from "@/lib/block-templates";
import { useEditorStore } from "@/lib/editor-store";
import AiPanel from "./ai-panel";
import BlockList from "./block-list";
import PreviewPane from "./preview-pane";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export default function EditorShell({ siteId }: { siteId: string }) {
  const setBlocks = useEditorStore((s) => s.setBlocks);
  const blocks = useEditorStore((s) => s.blocks);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const pastLen = useEditorStore((s) => s.past.length);
  const futureLen = useEditorStore((s) => s.future.length);
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const router = useRouter();
  const isNew = siteId === "new";
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  // Load site dari API (F3: data asli; 'new' = seed template)
  useEffect(() => {
    let alive = true;
    if (isNew) {
      setBlocks(SEED_TEMPLATE as never);
      setHydrated(true);
      setSaveState("dirty");
      return;
    }
    fetch(`/api/sites/${siteId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load gagal"))))
      .then((data) => {
        if (!alive) return;
        setBlocks(data.site.blocks ?? SEED_TEMPLATE);
        lastSavedRef.current = JSON.stringify(data.site.blocks ?? []);
        setHydrated(true);
        setSaveState("saved");
      })
      .catch(() => alive && (setLoadError("Gagal memuat website."), setHydrated(true)));
    return () => { alive = false; };
  }, [siteId, isNew, setBlocks]);

  // Auto-save debounce 1.5s saat blocks berubah (F3)
  useEffect(() => {
    if (!hydrated || isNew) return;
    const snapshot = JSON.stringify(blocks);
    if (snapshot === lastSavedRef.current) return;
    setSaveState("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/sites/${siteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocks }),
        });
        if (!res.ok) throw new Error();
        lastSavedRef.current = snapshot;
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 1500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [blocks, hydrated, isNew, siteId]);

  const saveLabel = {
    idle: "—", dirty: "● ada perubahan", saving: "⏳ menyimpan…", saved: "● tersimpan", error: "✖ gagal simpan",
  }[saveState];

  // F6: Publish — validasi server, lalu tawarkan buka site live
  async function publish() {
    if (isNew) {
      setPublishMsg("Simpan dulu website-mu sebelum publish (klik Buat di dashboard).");
      return;
    }
    setPublishing(true);
    setPublishMsg(null);
    try {
      // pastikan draft terbaru tersimpan dulu
      await fetch(`/api/sites/${siteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks }),
      });
      const res = await fetch(`/api/sites/${siteId}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setPublishMsg(data.error ?? "Publish gagal.");
        return;
      }
      setPublishMsg(`✔ Terpublish! Versi ${data.version}`);
      router.push(`/s/${data.url?.split("/").pop()}`);
    } catch {
      setPublishMsg("Koneksi bermasalah saat publish.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Topbar */}
      <header className="flex items-center justify-between gap-4 border-b-2 px-4 py-2.5">
        <div className="flex items-center gap-4">
          <Logo size={26} />
          <span className="nb-terminal text-sm">editor / {siteId}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="nb-badge"
            style={{
              color: saveState === "error" ? "var(--accent-danger)" : saveState === "saved" ? "var(--accent-success)" : "var(--muted)",
            }}
          >
            {saveLabel}
          </span>
          <button className="nb-btn nb-btn-ghost" onClick={undo} disabled={pastLen === 0}>
            ↶ Undo
          </button>
          <button className="nb-btn nb-btn-ghost" onClick={redo} disabled={futureLen === 0}>
            ↷ Redo
          </button>
          {/* F6: Publish aktif */}
          <button className="nb-btn nb-btn-mint" onClick={publish} disabled={publishing || !hydrated}>
            {publishing ? "🚀 Mempublish…" : "🚀 Publish"}
          </button>
        </div>
      </header>
      {loadError && (
        <p role="alert" className="px-4 pt-2 text-sm" style={{ color: "var(--accent-danger)" }}>
          {loadError}
        </p>
      )}
      {publishMsg && (
        <p role="status" className="px-4 pt-2 text-sm" style={{ color: "var(--accent-success)" }}>
          {publishMsg}
        </p>
      )}
      {/* Grid 2 kolom: kiri blok, kanan preview */}
      <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <AiPanel />
          <BlockList />
        </div>
        {hydrated ? <PreviewPane siteId={siteId} /> : null}
      </div>
    </div>
  );
}
