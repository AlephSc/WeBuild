"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import BlockRenderer from "@/components/blocks/renderer";

export default function PreviewPane({ siteId }: { siteId: string }) {
  const blocks = useEditorStore((s) => s.blocks);
  const selectedId = useEditorStore((s) => s.selectedId);
  const [mobile, setMobile] = useState(false);
  const refs = useRef<Map<string, HTMLElement | null>>(new Map());

  useEffect(() => {
    if (selectedId) refs.current.get(selectedId)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedId]);

  return (
    <section className="lg:sticky lg:top-4 lg:self-start">
      {/* Bar URL */}
      <div className="mb-2 flex items-center justify-between">
        <span className="nb-terminal text-sm">webuild.vercel.app/preview/{siteId}</span>
        <div className="flex gap-1">
          <button
            aria-label="Tampilan desktop"
            className="border-2 px-2 py-0.5 text-xs font-bold shadow-sm"
            style={!mobile ? { background: "var(--accent)", color: "var(--ink)" } : undefined}
            onClick={() => setMobile(false)}
          >
            🖥
          </button>
          <button
            aria-label="Tampilan mobile"
            className="border-2 px-2 py-0.5 text-xs font-bold shadow-sm"
            style={mobile ? { background: "var(--accent)", color: "var(--ink)" } : undefined}
            onClick={() => setMobile(true)}
          >
            📱
          </button>
        </div>
      </div>

      {/* Frame versi terang */}
      <div
        className="mx-auto w-full overflow-y-auto border-2 rounded-lg"
        style={{ background: "#FFF8E7", height: "calc(100vh - 120px)", maxWidth: mobile ? 390 : undefined }}
      >
        <div className="site-root flex flex-col gap-6 p-6">
          {blocks.map((block) => (
            <div
              key={block.id}
              ref={(el) => {
                refs.current.set(block.id, el);
              }}
              style={block.id === selectedId ? { outline: "2px dashed var(--accent)", outlineOffset: 4 } : undefined}
            >
              <BlockRenderer block={block} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
