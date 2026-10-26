import DOMPurify from "isomorphic-dompurify";

// Sanitasi teks user sebelum render halaman publik (anti stored-XSS, PRD F6).
// Hanya tag/format inline yang diizinkan — blok kami memakai komponen React,
// string ini murni data teks: bersihkan tag berbahaya, keep emoji/karakter normal.
const ALLOWED_TAGS = ["b", "strong", "i", "em", "br"];
const ALLOWED_ATTR: string[] = [];

export function sanitizeSiteText(input: string): string {
  if (typeof input !== "string") return "";
  return DOMPurify.sanitize(input, { ALLOWED_TAGS, ALLOWED_ATTR, KEEP_CONTENT: true });
}

// Uji XSS untuk black-box test (F13): script harus hilang total
export function isXssClean(input: string): boolean {
  const cleaned = sanitizeSiteText(input);
  return !cleaned.includes("<script") && !cleaned.includes("javascript:") && !cleaned.includes("onerror");
}
