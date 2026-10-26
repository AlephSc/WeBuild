// Slug utils — validasi blok & slug (F3, unit-tested)
import { validateBlock, type Block } from "./blocks";
import { SEED_TEMPLATE } from "./block-templates";

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "site"
  );
}

export function uniqueSlug(base: string, taken: Set<string>): string {
  const slug = slugify(base);
  if (!taken.has(slug)) return slug;
  const short = Math.random().toString(36).slice(2, 6);
  return `${slug}-${short}`;
}

// Validasi semua blok sebelum simpan/publish (PRD F3: blok rusak = 400 pesan jelas)
export function validateBlocks(blocks: unknown): { ok: true; blocks: Block[] } | { ok: false; error: string } {
  if (!Array.isArray(blocks) || blocks.length === 0)
    return { ok: false, error: "Halaman harus punya minimal 1 blok." };
  if (blocks.length > 50) return { ok: false, error: "Maksimal 50 blok per halaman." };
  for (const b of blocks) {
    const r = validateBlock(b as Block);
    if (!r.success)
      return { ok: false, error: `Blok tipe "${(b as Block)?.type ?? "?"}" tidak valid — periksa field wajib (mis. alt text).` };
  }
  return { ok: true, blocks: blocks as Block[] };
}

export { SEED_TEMPLATE, validateBlock };
export type { Block };
