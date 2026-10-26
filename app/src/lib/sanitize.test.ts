import { describe, it, expect } from "vitest";
import { sanitizeSiteText, isXssClean } from "./sanitize";

describe("sanitize (PRD F6 — anti stored-XSS)", () => {
  it("teks polos tidak berubah", () => {
    expect(sanitizeSiteText("Kopi susu gula aren 18rb")).toBe("Kopi susu gula aren 18rb");
  });
  it("tag <script> dihapus total", () => {
    const out = sanitizeSiteText('Halo <script>alert("xss")</script> semuanya');
    expect(out).not.toContain("<script");
    expect(out).toContain("Halo");
  });
  it("event handler onerror dihapus", () => {
    const out = sanitizeSiteText('<img src=x onerror=alert(1)>');
    expect(out).not.toContain("onerror");
  });
  it("javascript: URL dinetralkan", () => {
    expect(isXssClean('<a href="javascript:alert(1)">klik</a>')).toBe(true);
  });
  it("isXssClean: payload <script> hilang total (DOMPurify hapus isi juga) → clean", () => {
    expect(isXssClean("<script>x</script>")).toBe(true); // sanitasi menghapus seluruh tag+isi
    expect(sanitizeSiteText("<script>x</script>")).not.toContain("script");
    expect(sanitizeSiteText("<script>alert(1)</script>teks")).toContain("teks");
    expect(sanitizeSiteText("teks aman")).toBe("teks aman");
  });
  it("format inline aman (b/em) tetap", () => {
    const out = sanitizeSiteText("teks <b>tebal</b> dan <i>miring</i>");
    expect(out).toContain("<b>tebal</b>");
    expect(out).toContain("<i>miring</i>");
  });
});
