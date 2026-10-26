import { create } from "zustand";
import { type Block, type BlockType } from "@/lib/blocks";

const MAX_HISTORY = 50; // PRD F4: snapshot maks 50

function snapshot(blocks: Block[]) {
  return JSON.parse(JSON.stringify(blocks)) as Block[];
}

function newId() {
  return crypto.randomUUID();
}

type EditorState = {
  blocks: Block[];
  selectedId: string | null;
  past: Block[][];
  future: Block[][];
  setBlocks: (blocks: Block[]) => void;
  selectBlock: (id: string | null) => void;
  updateBlock: (id: string, data: Record<string, unknown>) => void;
  addBlock: (type: BlockType) => void;
  removeBlock: (id: string) => void;
  moveBlock: (id: string, dir: -1 | 1) => void;
  undo: () => void;
  redo: () => void;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  blocks: [],
  selectedId: null,
  past: [],
  future: [],

  setBlocks: (blocks) => set({ blocks, selectedId: null, past: [], future: [] }),

  selectBlock: (id) => set({ selectedId: id }),

  updateBlock: (id, data) =>
    set((s) => ({
      blocks: s.blocks.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...data } } : b)),
    })),

  addBlock: (type) =>
    set((s) => {
      const block: Block = { id: newId(), type, data: {} as Block["data"] };
      return {
        blocks: [...s.blocks, block],
        selectedId: block.id,
        past: [...s.past, snapshot(s.blocks)].slice(-MAX_HISTORY),
        future: [],
      };
    }),

  removeBlock: (id) =>
    set((s) => ({
      blocks: s.blocks.filter((b) => b.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      past: [...s.past, snapshot(s.blocks)].slice(-MAX_HISTORY),
      future: [],
    })),

  moveBlock: (id, dir) =>
    set((s) => {
      const i = s.blocks.findIndex((b) => b.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.blocks.length) return s;
      const blocks = [...s.blocks];
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
      return { blocks, past: [...s.past, snapshot(s.blocks)].slice(-MAX_HISTORY), future: [] };
    }),

  undo: () => {
    const { past, blocks, selectedId } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    set({
      blocks: prev,
      past: past.slice(0, -1),
      future: [snapshot(blocks), ...get().future],
      selectedId: prev.some((b) => b.id === selectedId) ? selectedId : null,
    });
  },

  redo: () => {
    const { future, blocks, selectedId } = get();
    if (!future.length) return;
    const next = future[0];
    set({
      blocks: next,
      future: future.slice(1),
      past: [...get().past, snapshot(blocks)].slice(-MAX_HISTORY),
      selectedId: next.some((b) => b.id === selectedId) ? selectedId : null,
    });
  },
}));
