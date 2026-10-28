// Anti prompt-injection (RAG/untrusted input) — lapisan L1 + L3 ringkas.
// Prinsip: input user = DATA untuk dibangun website, BUKAN instruksi.
// Tidak ada dependency baru (native/stdlib only, YAGNI).

/** Token chat-template open-weight (Llama/Grok/Qwen) yang dicoba diselundupkan. */
const TEMPLATE_TOKENS = /<\|im_start\|>|<\|im_end\|>|<\|eot_id\|>|<\|fim_\w+\|>|\[\/?INST\]|<<SYS>>|<<\/SYS>>|<s>|<\/s>/gi;

/** Fence markdown & tag ber-role yang bisa meniru struktur prompt. */
const STRUCTURE_TOKENS = /```+|<\/?(system|user|assistant|developer|tool|RAG|CONTEXT|USER_REQUEST|DATA)\b[^>]*>/gi;

/** Heuristik injeksi klasik — hanya untuk LOG, tidak memblokir (false positive merugikan demo). */
const INJECTION_PATTERNS: Array<[RegExp, string]> = [
  [/\b(abaikan|ignore|disregard|forget)\s+(semua\s+|all\s+)?(instruksi|previous|prior|above|sebelumnya)/i, "override-instruction"],
  [/\b(system\s+prompt|prompt\s+sistem|instruksi\s+rahasia|secret\s+instructions?)\b/i, "probe-system-prompt"],
  [/\b(kamu\s+sekarang|you\s+are\s+now|act\s+as|pretend\s+to\s+be|berperan\s+sebagai)\b/i, "persona-hijack"],
  [/\b(developer|god|evil)\s*mode\b|\bjailbreak\b|\bdan\b\s*(mode|jailbreak)/i, "jailbreak-token"],
  [/\b(reveal|print|repeat|tuliskan|tampilkan|cetak)\s+(your|the)?\s*(system|rahasia|secret)/i, "exfiltration"],
];

export type InjectionScan = { suspicious: boolean; patterns: string[] };

/** Deteksi heuristik — hasil untuk logging/telemetri, bukan keputusan blokir. */
export function detectInjection(raw: string): InjectionScan {
  const patterns = INJECTION_PATTERNS.filter(([re]) => re.test(raw)).map(([, name]) => name);
  return { suspicious: patterns.length > 0, patterns };
}

/**
 * Netralkan input user sebelum masuk prompt:
 * - NFKC normalize (homoglyph/zero-width defense)
 * - strip zero-width chars
 * - tandai token template/fence/role-tag menjadi placeholder aman
 */
export function sanitizeInput(raw: string, maxLen = 2000): string {
  let text = raw.normalize("NFKC").replace(/[\u200b\u200c\u200d\u2060\ufeff]/g, "");
  text = text.replace(TEMPLATE_TOKENS, "[TEMPLATETOKEN]").replace(STRUCTURE_TOKENS, "\n");
  if (text.length > maxLen) text = text.slice(0, maxLen) + "…[dipotong]";
  return text;
}

/** Bungkus input user dengan delimiter data eksplisit (context firewall, L3). */
export function wrapUserInput(raw: string, maxLen = 2000): string {
  return `<user_request>\n${sanitizeInput(raw, maxLen)}\n</user_request>`;
}
