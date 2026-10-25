// Konstanta AI Provider (D10: konstanta kode, bukan tabel — admin toggle di F10)
export const AI_PROVIDERS = {
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    envKey: "GEMINI_API_KEY",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-2.0-flash",
  },
  groq: {
    id: "groq",
    label: "Groq",
    envKey: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.1-8b-instant",
  },
} as const;

export type ProviderId = keyof typeof AI_PROVIDERS;
export const PROVIDER_IDS = Object.keys(AI_PROVIDERS) as ProviderId[];

// Token budget (F8, saran AI reviewer): input max 4K, output max 800
export const AI_TOKEN_BUDGET = { input: 4000, output: 800 };
