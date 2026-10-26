"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/nav";
import { SEED_TEMPLATE } from "@/lib/block-templates";
import { useEditorStore } from "@/lib/editor-store";
import AiPanel from "./ai-panel";
import BlockList from "./block-list";
import PreviewPane from "./preview-pane";

export default function EditorShell({ siteId }: { siteId: string }) {
  const setBlocks = useEditorStore((s) => s.setBlocks);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const pastLen = useEditorStore((s) => s.past.length);
  const futureLen = useEditorStore((s) => s.future.length);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // ponytail: mock-sites belum bawa blocks — pakai SEED_TEMPLATE sampai F3 (Prisma)
    setBlocks(SEED_TEMPLATE as never);
    setHydrated(true);
  }, [siteId, setBlocks]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Topbar */}
      <header className="flex items-center justify-between gap-4 border-b-2 px-4 py-2.5">
        <div className="flex items-center gap-4">
          <Logo size={26} />
          <span className="nb-terminal text-sm">editor / {siteId}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="nb-badge" style={{ color: "var(--mint, #7BD8A4)" }}>
            tersimpan
          </span>
          <button className="nb-btn nb-btn-ghost" onClick={undo} disabled={pastLen === 0}>
            ↶ Undo
          </button>
          <button className="nb-btn nb-btn-ghost" onClick={redo} disabled={futureLen === 0}>
            ↷ Redo
          </button>
          {/* F6: Publish flow — disabled di v1 */}
          <button className="nb-btn nb-btn-mint" disabled title="F6">
            Publish
          </button>
        </div>
      </header>

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
