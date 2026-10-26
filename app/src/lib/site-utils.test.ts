import { describe, it, expect } from "vitest";
import { slugify, uniqueSlug, validateBlocks } from "./site-utils";
import { SEED_TEMPLATE } from "./block-templates";

describe("slugify", () => {
  it("judul normal → slug', ", () => {
    expect(slugify("Kopi Kenangan Senja")).toBe("kopi-kenangan-senja");
  });
  it("judul kosong → fallback 'site'", () => {
    expect(slugify("!!!")).toBe("site");
  });
  it("hapus diakritik & simbol", () => {
    expect(slugify("Kopi Dé' Senja – 24 Jam!")).toBe("kopi-de-senja-24-jam");
  });
});

describe("uniqueSlug", () => {
  it("tidak bentrok → slug polos", () => {
    expect(uniqueSlug("Toko Bunga", new Set())).toBe("toko-bunga");
  });
  it("bentrok → auto-suffix 4 char", () => {
    const result = uniqueSlug("Toko Bunga", new Set(["toko-bunga"]));
    expect(result).toMatch(/^toko-bunga-[a-z0-9]{4}$/);
    expect(result).not.toBe("toko-bunga");
  });
});

describe("validateBlocks (PRD F3)", () => {
  it("SEED_TEMPLATE lolos", () => {
    expect(validateBlocks(SEED_TEMPLATE).ok).toBe(true);
  });
  it("array kosong → error", () => {
    expect(validateBlocks([]).ok).toBe(false);
  });
  it("bukan array → error", () => {
    expect(validateBlocks("bukan-array").ok).toBe(false);
  });
  it("blok rusak (alt kosong) → error pesan jelas", () => {
    const bad = [{ id: "x", type: "image", data: { url: "https://a.com/i.png", alt: "" } }];
    const r = validateBlocks(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("image");
  });
  it(">50 blok → error", () => {
    const many = Array.from({ length: 51 }, (_, i) => ({ ...SEED_TEMPLATE[0], id: `b${i}` }));
    expect(validateBlocks(many).ok).toBe(false);
  });
});
