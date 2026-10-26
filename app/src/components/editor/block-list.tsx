"use client";

import { useState } from "react";
import { BLOCK_TYPES, type BlockType } from "@/lib/blocks";
import { useEditorStore } from "@/lib/editor-store";
import BlockForm from "@/components/blocks/forms";

function MiniBtn({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className="border-2 px-1.5 text-xs font-bold shadow-sm hover:bg-white/10"
    >
      {label}
    </button>
  );
}

export default function BlockList() {
  const blocks = useEditorStore((s) => s.blocks);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const moveBlock = useEditorStore((s) => s.moveBlock);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Blok Halaman</h2>
        <span className="nb-terminal text-sm">{blocks.length} blok</span>
      </div>

      {blocks.map((block, i) => {
        const open = openId === block.id;
        const active = selectedId === block.id;
        return (
          <div
            key={block.id}
            className="nb-card"
            style={active ? { outline: "2px solid var(--accent)" } : undefined}
            onClick={() => selectBlock(block.id)}
          >
            <div className="flex items-center justify-between gap-2">
              <button className="flex-1 text-left" onClick={() => setOpenId(open ? null : block.id)}>
                <span className="text-xs font-bold uppercase" style={{ color: "var(--accent)" }}>
                  {block.type}
                </span>
                <span className="ml-2 text-xs opacity-50">{open ? "▾" : "▸"}</span>
              </button>
              <div className="flex gap-1">
                <MiniBtn label="↑" title="Naik" onClick={() => moveBlock(block.id, -1)} />
                <MiniBtn label="↓" title="Turun" onClick={() => moveBlock(block.id, 1)} />
                <MiniBtn label="✕" title="Hapus" onClick={() => removeBlock(block.id)} />
              </div>
            </div>

            {open && (
              <div className="mt-3">
                <BlockForm type={block.type} data={block.data} onChange={(data) => updateBlock(block.id, data)} />
              </div>
            )}
          </div>
        );
      })}

      <div className="grid grid-cols-3 gap-2">
        {(BLOCK_TYPES as (BlockType | { type: BlockType; label?: string })[]).map((t) => {
          const type = typeof t === "string" ? t : t.type;
          const label = typeof t === "string" ? t : (t.label ?? t.type);
          return (
            <button key={type} className="nb-btn nb-btn-ghost text-sm" onClick={() => addBlock(type as BlockType)}>
              + {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
