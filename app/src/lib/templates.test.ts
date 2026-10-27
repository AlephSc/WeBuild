import { describe, expect, it } from "vitest";
import { SITE_TEMPLATES, SEED_TEMPLATE } from "./block-templates";
import { validateBlocks } from "./site-utils";

// F11: setiap template harus menghasilkan set blok yang valid (tidak boleh cacat sejak awal)
describe("template polish (F11)", () => {
  it("katalog berisi minimal 4 template", () => {
    expect(SITE_TEMPLATES.length).toBeGreaterThanOrEqual(4);
  });

  it("setiap template punya id unik + deskripsi", () => {
    const ids = SITE_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of SITE_TEMPLATES) {
      expect(t.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("blocks dari setiap template lolos validateBlocks", () => {
    for (const t of SITE_TEMPLATES) {
      const r = validateBlocks(t.blocks());
      expect(r.ok, `template ${t.id}: ${r.ok ? "" : r.error}`).toBe(true);
    }
  });

  it("template dimulai dengan hero dan diakhiri blok aksi (button/contact)", () => {
    for (const t of SITE_TEMPLATES) {
      const b = t.blocks();
      expect(b[0]?.type, `${t.id} harus mulai hero`).toBe("hero");
      const last = b[b.length - 1]?.type;
      expect(["button", "contact"], `${t.id} harus diakhiri aksi, dapat ${last}`).toContain(last);
    }
  });

  it("seed template tetap valid (kompatibilitas)", () => {
    expect(validateBlocks(SEED_TEMPLATE).ok).toBe(true);
  });
});
