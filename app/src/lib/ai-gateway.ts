// F8: AI Gateway — prompt → structured output (JSON blocks) → validasi zod.
// Non-streaming (D6): output pendek. Kuota atomik di route.ts (UPDATE ... WHERE).
import { AI_PROVIDERS, AI_TOKEN_BUDGET, type ProviderId } from "./ai-providers";
import { validateBlock, type Block } from "./blocks";
import { log } from "./log";

const SYSTEM_PROMPT = `Kamu adalah asisten pembuat konten website untuk UMKM/siswa Indonesia.
Tugas: ubah instruksi user menjadi array BLOK website dalam JSON.

Blok yang tersedia (type + field):
1. {"type":"hero","data":{"heading":"judul besar 3-8 kata","subheading":"kalimat pendek","ctaLabel":"teks tombol (opsional)","ctaUrl":"https://... (opsional, pakai wa.me/62 untuk WA)","imageUrl":"","alt":""}}
2. {"type":"text","data":{"heading":"judul bagian (opsional)","body":"paragraf konten, boleh <b>/<i>"}}
3. {"type":"image","data":{"url":"","alt":"deskripsi gambar WAJIB","caption":""}}
4. {"type":"button","data":{"label":"teks tombol","url":"https://wa.me/62..."}}
5. {"type":"gallery","data":{"images":[{"url":"","alt":"WAJIB"}]}}
6. {"type":"contact","data":{"phone":"08...","message":"pesan WA otomatis (opsional)"}}

Aturan:
- 4-6 blok per website, mulai dengan hero, akhiri dengan button/contact.
- Bahasa Indonesia yang natural & menjual.
- image/gallery: biarkan url kosong "" (user upload sendiri) TAPI alt tetap diisi deskripsi.
- contact/button WA: nomor dari instruksi user; kalau tidak ada, pakai "081200000000".
- Output HANYA JSON array valid, tanpa penjelasan, tanpa markdown fence.`;

export type GenerateResult =
  | { ok: true; blocks: Block[]; provider: ProviderId; tokens: { in: number; out: number } }
  | { ok: false; error: string; code: "AI_UNAVAILABLE" | "AI_INVALID_OUTPUT" };

export async function generateBlocksWithAI(instruction: string): Promise<GenerateResult> {
  const errors: string[] = [];

  for (const providerId of ["gemini", "groq"] as ProviderId[]) {
    const provider = AI_PROVIDERS[providerId];
    const apiKey = process.env[provider.envKey];
    if (!apiKey) {
      errors.push(`${providerId}: no key`);
      continue;
    }

    try {
      const raw = await callProvider(providerId, instruction, apiKey);
      const blocks = extractBlocks(raw);
      // Validasi tiap blok dengan schema registry (F8 spec)
      const valid: Block[] = [];
      for (const b of blocks) {
        if (validateBlock(b).success) valid.push(b);
      }
      if (valid.length === 0) throw new Error("no valid blocks");
      return {
        ok: true,
        blocks: valid,
        provider: providerId,
        tokens: { in: Math.ceil((SYSTEM_PROMPT.length + instruction.length) / 4), out: Math.ceil(raw.length / 4) },
      };
    } catch (e) {
      log("warn", "ai provider gagal, coba fallback", { provider: providerId, err: String(e).slice(0, 120) });
      errors.push(`${providerId}: ${String(e).slice(0, 80)}`);
    }
  }

  return { ok: false, error: "Layanan AI sedang tidak tersedia. Coba lagi sebentar.", code: "AI_UNAVAILABLE" };
}

async function callProvider(providerId: ProviderId, instruction: string, apiKey: string): Promise<string> {
  const provider = AI_PROVIDERS[providerId];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s budget

  try {
    if (providerId === "gemini") {
      const res = await fetch(
        `${provider.baseUrl}/models/${provider.model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: instruction.slice(0, AI_TOKEN_BUDGET.input * 4) }] }],
            generationConfig: {
              maxOutputTokens: 4096, // thinking model memakan budget — 800 terlalu kecil, JSON terpotong
              temperature: 0.7,
              responseMimeType: "application/json", // structured output native (F8 spec!)
            },
          }),
        }
      );
      if (!res.ok) throw new Error(`gemini http ${res.status}`);
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    }

    // Groq (OpenAI-compatible)
    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: instruction.slice(0, AI_TOKEN_BUDGET.input * 4) },
        ],
        max_tokens: AI_TOKEN_BUDGET.output,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error(`groq http ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timeout);
  }
}

// Ekstrak array JSON dari respons (tahan markdown fence & teks sampul)
function extractBlocks(raw: string): Block[] {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return [];
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
