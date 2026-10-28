// Sanitasi teks user sebelum render halaman publik (anti stored-XSS, PRD F6).
// Implementasi NATIVE tanpa dependensi: isomorphic-dompurify (jsdom) gagal dimuat
// di runtime serverless Vercel (ERR_REQUIRE_ESM), sedangkan kontrak keamanan kita
// sederhana — hanya tag format inline yang diizinkan, selebihnya dibuang.
const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "br"]);

function stripOnce(input: string): string {
  // 1) Hapus blok script/style BESERTA seluruh isinya (keep-content = false).
  let out = input.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  // 2) Tag lain: yang diizinkan dipertahankan (tanpa atribut berbahaya),
  //    sisanya dibuang tapi isinya (teks) dipertahankan.
  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (tag, raw) => {
    if (!ALLOWED_TAGS.has(String(raw).toLowerCase())) return "";
    // buang atribut event handler & URL attributes pada tag yang diizinkan
    return tag
      .replace(/\s(?:on[a-z]+|(?:href|src|xlink:href))\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\s(?:on[a-z]+|(?:href|src|xlink:href))\s*=\s*(?:[^\s>]+)/gi, "");
  });
  return out;
}

export function sanitizeSiteText(input: string): string {
  if (typeof input !== "string") return "";
  // Iterasi hingga stabil — mencegah re-komposisi tag dari payload bersarang
  // seperti "<scr<script>ipt>alert(1)</script>".
  let out = input;
  for (let i = 0; i < 5; i++) {
    const next = stripOnce(out);
    if (next === out) break;
    out = next;
  }
  return out;
}

// Uji XSS untuk black-box test (F13): script harus hilang total
export function isXssClean(input: string): boolean {
  const cleaned = sanitizeSiteText(input);
  return !cleaned.includes("<script") && !cleaned.includes("javascript:") && !cleaned.includes("onerror");
}
