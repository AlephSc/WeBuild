# Riset: Agent Harness untuk AI Website Builder (WeBuild)

> Dokumen riset internal WeBuild. Disusun berdasarkan survey sumber industri & akademik (daftar URL lengkap di bagian akhir). Target: merancang harness agent yang mengubah pipeline non-streaming single-shot Gemini/Groq saat ini menjadi loop generate → validate → critique → refine yang terukur.

---

## 1. Definisi & Anatomi Agent Harness

### 1.1 Definisi

**Agent harness** adalah lapisan orkestrasi di sekitar LLM yang mengubah satu panggilan model menjadi *sistem agentic*: ia menyediakan loop eksekusi, akses tool, memori/konteks, aturan perilaku (system prompt/guardrails), dan mekanisme evaluasi-umpan-balik. Anthropic membedakan dua kategori agentic system ([Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)):

- **Workflow**: LLM & tool diorkestrasi lewat *code path* yang telah ditentukan (prediktabel, konsisten).
- **Agent**: LLM yang secara dinamis mengarahkan proses & penggunaan tool-nya sendiri.

Analogi populer: model adalah "otak", harness adalah "tubuh + saraf pusat" — Claude Code, Codex, dsb. disebut *harness* karena selain model mereka membawa loop, tool, permission, dan evaluasi. Panduan OpenAI merumuskan agent minimal sebagai tiga komponen: **Model + Tools + Instructions** ([A Practical Guide to Building AI Agents](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/)).

### 1.2 Anatomi: lima komponen inti

```
┌────────────────────────────────────────────────────────┐
│                    AGENT HARNESS                       │
│                                                        │
│  ┌──────────┐   plan    ┌──────────┐   tool calls     │
│  │ PLANNER  │──────────▶│ EXECUTOR │◀───────────────┐ │
│  └──────────┘           └────┬─────┘                │ │
│       ▲                      │ artifact             │ │
│       │              ┌───────▼────────┐              │ │
│       │              │  VALIDATOR /   │              │ │
│       │              │  CRITIC (eval) │──────────────┘ │
│       │              └────────────────┘   feedback     │
│  ┌────┴─────────────────────────────────────────────┐  │
│  │ MEMORY (context, plan state, refleksi, riwayat)  │  │
│  │ GUARDRAILS (input filter, schema check, budget)  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

1. **Planner (plan-and-execute)** — satu panggilan LLM kuat yang mendekomposisi permintaan menjadi rencana terstruktur (DAG subtask: sitemap, copy, style tokens, section blocks). Keunggulan: rencana dapat diinspeksi/divalidasi sebelum eksekusi; lebih hemat token daripada ReAct murni karena eksekutor tidak perlu "berpikir" ulang tiap langkah ([The AI Engineer: 4 single-agent patterns](https://theaiengineer.substack.com/p/the-4-single-agent-patterns); [Oracle: ReAct vs Plan & Execute](https://blogs.oracle.com/integration/react-vs-plan-execute-choosing-the-right-agent-thinking-pattern-in-oracle-integration)).

2. **Executor + Tool Use** — model (boleh lebih kecil/murah) menjalankan rencana lewat tool: `generate_html`, `write_file`, `run_lighthouse`, `screenshot`, `search_images`, dll. Prinsip ACI (Agent-Computer Interface) dari Anthropic: definisi tool sejelas docstring untuk developer junior, beri contoh penggunaan, hindari format yang rawan kesalahan (escaping JSON, diff dengan line-count), dan *poka-yoke* — buat argumen sulit dipakai salah. Anthropic melaporkan menghabiskan lebih banyak waktu mengoptimalkan tool daripada prompt utama.

3. **Memory** — tiga lapis:
   - *Working memory*: konteks percakapan + rencana + state file saat ini.
   - *Episodic/reflection memory*: teks refleksi dari percobaan gagal (pola Reflexion) yang di-feed ke percobaan berikutnya ([Reflexion, arXiv:2303.11366](https://arxiv.org/abs/2303.11366)).
   - *Project memory*: design tokens, brand, keputusan desain yang persisten antar permintaan user.

4. **Guardrails** — filter input (jailbreak/relevansi), validasi skema output (JSON schema, HTML parseable), batas anggaran (maks iterasi, maks token, timeout), dan titik eskalasi ke manusia ketika threshold gagal terlampaui atau aksi berisiko (panduan OpenAI). Terapkan sebagai fungsi deterministik, bukan prompt "tolong berhati-hati".

5. **Reflection / Eval loop** — satu LLM (atau kumpulan heuristik + LLM judge) mengevaluasi artefak terhadap kriteria eksplisit, menghasilkan critique actionable, lalu generator merevisi. Ini adalah pola **Evaluator–Optimizer** Anthropic, efektif ketika (a) ada kriteria evaluasi yang jelas dan (b) umpan balik terbukti memperbaiki output. Penelitian Reflexion menunjukkan refleksi verbal + memori menaikkan pass@1 HumanEval dari 80% → 91%.

### 1.3 Kapan pakai agent vs workflow

- Gunakan **workflow deterministik** bila subtask sudah diketahui (prompt → plan → generate → validate → refine adalah urutan tetap → WeBuild idealnya *workflow dengan elemen agentic*, bukan agent otonom penuh).
- Naikkan otonomi hanya bila fleksibilitas dibutuhkan (mis. user minta revisi bebas).
- Anthropic: mulai dari solusi paling sederhana; agentic system menukar latensi & biaya dengan kualitas.

---

## 2. Survey Pattern Industri

| Pattern | Inti | Kapan dipakai | Sumber |
|---|---|---|---|
| **ReAct** | Thought → Action → Observation berulang, 1 panggilan LLM per step | Task eksploratif, langkah berikutnya bergantung hasil sebelumnya; mahal di rantai panjang | [arXiv:2210.03629](https://arxiv.org/abs/2210.03629) |
| **Plan-and-Execute** | Planner membuat rencana penuh di muka; executor murah mengeksekusi; replanner aktif saat gagal | Step diketahui dari goal; butuh determinisme & inspeksi; jauh lebih sedikit panggilan LLM (10-step: 1–2 call vs 10) | [Oracle OIC](https://blogs.oracle.com/integration/react-vs-plan-execute-choosing-the-right-agent-thinking-pattern-in-oracle-integration), [The AI Engineer](https://theaiengineer.substack.com/p/the-4-single-agent-patterns) |
| **Reflexion** | Setelah percobaan, agent mengkritik output sendiri, simpan refleksi di memori, coba lagi | Ada pass/fail criteria jelas & kualitas > kecepatan; HumanEval 80% → 91% | [arXiv:2303.11366](https://arxiv.org/abs/2303.11366) |
| **Self-critique / Evaluator–Optimizer** | Generator + evaluator berbeda dalam loop | Kriteria evaluasi jelas; refinement memberi nilai terukur (literary translation, search kompleks — dan *code/website generation*) | [Anthropic](https://www.anthropic.com/engineering/building-effective-agents) |
| **Prompt chaining (+ gates)** | Dekomposisi berurutan dengan pemeriksaan programatik antar step | Task terdekomposisi bersih: outline → cek → dokumen | [Anthropic](https://www.anthropic.com/engineering/building-effective-agents) |
| **Orchestrator–workers** | LLM pusat mendekomposisi dinamis & delegasi ke worker | Coding/multi-file, subtask tak terprediksi | [Anthropic](https://www.anthropic.com/engineering/building-effective-agents) |
| **Parallelization (sectioning/voting)** | Subtask paralel atau voting multi-attempt | Guardrail terpisah dari respons; eval multi-aspek | [Anthropic](https://www.anthropic.com/engineering/building-effective-agents) |
| **LLM-as-Judge** | LLM kuat menilai output vs rubrik; ≥80% agreement dengan manusia; waspadai position/verbosity/self-enhancement bias → mitigasi: swap posisi, rubrik eksplisit, panel juri | Eval otomatis output open-ended (website, copy) | [arXiv:2306.05685](https://arxiv.org/abs/2306.05685), [PoLL arXiv:2404.18796](https://arxiv.org/abs/2404.18796) |
| **Hybrid** | ReAct + Reflexion (retry bila validasi gagal); Plan-and-Execute dengan fallback ReAct | Kombinasi pragmatis yang paling umum di produksi | [The AI Engineer](https://theaiengineer.substack.com/p/the-4-single-agent-patterns) |

**Temuan lintas sumber:**
- Implementasi sukses memakai **pattern sederhana yang dapat dikomposisi**, bukan framework kompleks; mulai dari LLM API langsung ([Anthropic](https://www.anthropic.com/engineering/building-effective-agents)).
- Panduan OpenAI: mulai **single-agent** dengan tool & instruksi baik; naik ke multi-agent hanya bila perlu; guardrails di setiap tahap; rencanakan *human intervention* (threshold kegagalan, aksi berisiko).
- Untuk web/frontend generation secara spesifik, riset akademik terkonfirmasi: feedback loop eksekusi (Lighthouse, Pa11y, usability heuristics) + quality gate memperbaiki signifikan kualitas LLM-generated frontend dan kompetitif dengan builder komersial seperti Lovable ([Itera-Web-Q, ACM](https://dl.acm.org/doi/pdf/10.1145/3816713.3818803)); framework WebLoop melatih Generator–Critic–Refiner secara bersama dengan reward eksekusi browser dan meningkatkan akurasi WebGen-Bench 15,4 poin ([arXiv:2610.11543](https://arxiv.org/html/2610.11543)). Pola GAN-loop Generator↔Evaluator (Playwright + skor) juga dipakai proyek open source untuk kualitas desain subjektif ([Mnemo Harness](https://github.com/Mnemo-mcp/Harness), [AgentSite orchestrator](https://github.com/jhd3197/AgentSite/blob/00e48798/agentsite/agents/orchestrator.py)).

---

## 3. Penerapan Konkret ke WeBuild

### 3.1 Alur generate → validate → critique → refine

```
User prompt
   │
   ▼
[0] GUARDRAIL INPUT  ── filter relevansi/panjang/injeksi (deterministik)
   │
   ▼
[1] PLAN (1 call, model kuat, temperature rendah)
   │   Output JSON terstruktur:
   │   { site_type, audience, tone, sitemap: [...],
   │     design_tokens: {colors, fonts, spacing, radius},
   │     blocks: [{id, type, purpose, content_brief}], assets }
   │   → Validasi skema programatik (JSON Schema); gagal → retry 1×
   ▼
[2] GENERATE (1–N call, model cepat)
   │   Render tiap block → HTML/CSS/JS; gunakan design tokens dari plan
   ▼
[3] VALIDATE (deterministik, tanpa LLM — cepat & gratis)
   │   • HTML parseable, tidak ada tag tidak tertutup
   │   • Semua token dari plan dipakai (tidak ada warna/hex liar)
   │   • Meta viewport, alt pada <img>, label pada <input>, heading hierarchy (satu h1)
   │   • Ukuran file < batas; tidak ada resource eksternal yang dilarang
   │   → Gagal keras → kembali ke [2] dengan error list (maks 2×)
   ▼
[4] CRITIQUE (1 call, model kuat, LLM-as-judge)
   │   Rubrik skor 1–5 × bobot: layout & hierarchy, kontras & aksesibilitas,
   │   responsive, copywriting, kelengkapan blok vs plan, kualitas kode
   │   → Output: skor + daftar masalah spesifik + saran perbaikan konkret
   ▼
[5] REFINE (1 call, model cepat)
   │   Input: kode saat ini + critique (bukan regenerate dari nol)
   │   → Edit terarah (patch section, bukan rewrite)
   ▼
   └─ loop [3]→[5] hingga skor ≥ threshold ATAU maks iterasi (default 2)
   ▼
[6] FINAL GUARDRAIL + DELIVER  (re-validasi deterministik, simpan memory proyek)
```

Keputusan desain pipeline (berdasar survey):
- **Plan-and-execute**, bukan ReAct: subtask pembuatan website diketahui dari prompt → hemat 60–80% panggilan LLM vs ReAct.
- **Validate deterministik dulu** sebelum critique LLM: murah, cepat, menangkap 80% kegagalan keras (HTML rusak, token tak terpakai).
- **Critique terpisah dari generator** (evaluator–optimizer Anthropic): model yang sama mengkritik dirinya sendiri cenderung *self-enhancement bias* (temuan MT-Bench) — gunakan model berbeda (mis. generator Groq, judge Gemini) atau minimal prompt judge berbeda.
- **Refine = patch, bukan regenerate**: jaga biaya token & hindari regresi pada bagian yang sudah baik.

### 3.2 Rules / System Prompt Agent

**A. Design tokens (wajib, sumber kebenaran dari plan):**
1. Semua warna, font, spacing, radius WAJIB lewat CSS custom properties (`--color-primary`, `--space-*`, `--font-*`). Dilarang hardcode hex/px di luar `:root`.
2. Maksimal palet: 1 warna primer, 1 aksen, 2–3 netral. Font: maks 2 keluarga (heading + body).
3. Skala spacing modulo 4/8px (4, 8, 12, 16, 24, 32, 48, 64, 96).

**B. Struktur blok:**
4. Halaman tersusun dari blok semantik: `hero`, `features`, `testimonials`, `pricing`, `cta`, `faq`, `footer`. Tiap blok = satu `<section>` dengan `aria-label` dan class BEM-ish (`block--hero`).
5. Setiap blok punya SATU tujuan dari plan; jangan menggabungkan tujuan. Section kosong/placeholder dilarang.
6. Gunakan HTML semantik (`header/nav/main/section/footer`), satu `<h1>`, heading tidak melompat level.

**C. Kontras & aksesibilitas:**
7. Rasio kontras teks minimal WCAG AA: 4.5:1 teks normal, 3:1 teks besar. Jangan tempatkan teks tipis terang di atas gambar tanpa overlay gelap ≥40%.
8. Semua `<img>` beri `alt` bermakna; semua input beri `<label>`; fokus keyboard terlihat (`:focus-visible`).
9. Target interaktif min. 44×44px.

**D. Hierarchy & visual:**
10. Ukuran heading sekuensial jelas (h1 ≈ 2.5–3.5rem desktop), line-height body ≥ 1.5, lebar baris teks maks ~75 karakter (max-width konten ±72ch).
11. Whitespace sebelum kerapatan: padding section min. `--space-16` (64px) vertikal di desktop.
12. Satu CTA primer per viewport; hierarki CTA: primer (solid), sekunder (outline), tersier (link).

**E. Responsive:**
13. Mobile-first; `<meta name="viewport" ...>` wajib; breakpoints 640/768/1024/1280.
14. Grid/flex dengan `minmax()` dan `clamp()` untuk tipografi fluid; tidak ada overflow horizontal pada 320px.
15. Gambar responsif (`srcset`/`object-fit`), lazy-load di bawah fold.

**F. Efisiensi & teknis:**
16. Satu file HTML + satu CSS (dan JS bila perlu) per halaman; tanpa framework kecuali diminta; tanpa resource eksternal berat (font via system stack atau 1 Google Font).
17. Output harus langsung renderable — valid HTML5, tidak ada TODO/placeholder `[lorem]`.
18. JANGAN menulis penjelasan di luar format output yang diminta (JSON di fase plan, kode di fase generate).

**G. Guardrail perilaku loop:**
19. Saat refine: ubah HANYA bagian yang disebut critique; pertahankan sisanya byte-per-byte bila mungkin.
20. Jika permintaan ambigu dan tidak ada di plan, buat asumsi paling masuk akal dan catat di komentar HTML `<!-- assumption: ... -->`.

### 3.3 Batas token & latensi

| Fase | Model (rekomendasi) | Budget token out | Target latensi |
|---|---|---|---|
| Plan | Gemini (kuat), temp 0.2–0.4 | ≤ 2K (JSON plan) | 3–6 s |
| Generate | Groq (cepat), temp 0.6–0.8 | ≤ 8K per halaman | 5–10 s |
| Validate | deterministik (kode) | 0 | < 1 s |
| Critique | Gemini (kuat), temp 0–0.2 | ≤ 1.5K (skor+list) | 3–5 s |
| Refine | Groq, temp 0.3–0.5 | ≤ 4K (patch) | 4–8 s |

- **Total single pass:** ±15–30 s. **Dengan 2 iterasi refine:** maks ±60 s — tetap dapat diterima untuk generator website (bandingkan Lovable/v0).
- **Hard budget harness:** maks 3 panggilan LLM per fase, maks 4 panggilan total per iterasi, maks 2 iterasi refine, total token out ≤ 25K, timeout total 90 s → jika terlampaui, kirim hasil terbaik + catat kegagalan (prinsip stopping condition Anthropic & threshold OpenAI).
- Kurangi konteks: kirim critique + blok terdampak saja saat refine, bukan seluruh riwayat.

### 3.4 Evaluasi kualitas otomatis

**Lapis 1 — heuristik deterministik (selalu jalan):**
- HTML valid (parser), tag tertutup, satu `h1`, viewport meta ada.
- Semua nilai warna/spasi berasal dari token; kontras dihitung programatik (WCAG ratio) untuk kombinasi fg/bg yang terdeteksi.
- Kelengkapan: setiap blok dari plan ada di output; tidak ada string placeholder.
- Ukuran & jumlah request eksternal.

**Lapis 2 — LLM-as-judge (per iterasi):**
- Rubrik 1–5 dengan bobot: layout & visual hierarchy (25%), kontras & aksesibilitas (20%), responsive (15%), copywriting & relevansi ke prompt (20%), kelengkapan vs plan (10%), kualitas kode (10%).
- Mitigasi bias MT-Bench: rubrik eksplisit + definisi tiap skor, tampilkan prompt user, swap urutan bila membandingkan dua kandidat.
- Threshold rilis: total weighted ≥ 4.0/5 dan tidak ada dimensi ≤ 2.

**Lapis 3 — eksekusi nyata (roadmap):**
- Headless browser (Playwright) → screenshot 3 viewport (mobile/tablet/desktop), Lighthouse accessibility & performance, deteksi overflow horizontal. Ini pola terbukti dari Itera-Web-Q & Mnemo Harness.
- Eval regresi offline: kumpulan 20–50 prompt golden, jalankan pipeline, bandingkan skor antar versi harness (sesuai anjuran OpenAI: *set up evals to establish a performance baseline* sebelum optimasi model).
- Panel juri kecil (PoLL) bila anggaran judge memungkinkan: lebih murah 7× dan mengurangi intra-model bias ([arXiv:2404.18796](https://arxiv.org/abs/2404.18796)).

---

## 4. Rekomendasi Implementasi Bertahap (dari single-shot Gemini/Groq)

### Fase 0 — Fondasi (1–2 hari)
- Pisahkan kode: `llm_client` (Gemini/Groq adapter), `prompts/` (plan, generate, critique, refine sebagai template terpisah), `schemas/` (JSON Schema untuk plan & critique).
- Terima output plan sebagai JSON (structured output / function calling), validasi skema. **Ini satu perubahan yang memberi nilai terbesar** — structured plan menjadikan semua fase berikutnya dapat diuji.

### Fase 1 — Minimal Viable Harness (MVP, ±1 minggu)
```
prompt → plan (Gemini) → generate (Groq) → validate deterministik
       → jika gagal: retry generate dengan error list (maks 2×)
       → critique (Gemini) → refine (Groq, maks 2 iterasi) → deliver
```
- Tanpa streaming, tanpa browser, tanpa memori jangka panjang. Validasi = cek HTML + viewport + heading + token usage (regex/CSS parse).
- Critique & refine di belakang flag konfigurasi (`HARNESS_ITERATIONS=0` → perilaku lama; `=2` → perilaku baru) agar mudah A/B.
- Simpan semua artefak iterasi (plan, kode, skor, critique) ke log/DB — data eval gratis.

### Fase 2 — Kualitas & kontrol (±2 minggu)
- LLM-judge dengan rubrik berbobot + threshold rilis; mitigasi bias (model judge ≠ model generator).
- Guardrails: filter input, budget token/latensi, stopping conditions, fallback (jika Groq gagal → Gemini generate).
- Memory proyek: design tokens & keputusan disimpan, dipakai ulang untuk permintaan revisi user ("ganti warna primer" → patch token saja, bukan regenerate).

### Fase 3 — Eksekusi-nyata & streaming (±1 bulan)
- Playwright: screenshot 3 viewport + Lighthouse; critique menerima skor objektif, bukan hanya kode.
- Streaming per-blok: kirim hero lebih dulu ke UI sambil blok lain digenerate (perbaikan persepsi latensi terbesar).
- Opsional: orchestrator–workers untuk multi-halaman (halaman digenerate paralel dari plan yang sama).

### Fase 4 — Pembelajaran (opsional, jangka menengah)
- Golden set + eval offline otomatis di CI; panel juri; analisis kegagalan berulang → perbaiki prompt/rules (bukan menaikkan kompleksitas). Data refleksi dari iterasi gagal dapat difeed kembali sebagai few-shot (pola Reflexion).

**Prinsip pemandu (Anthropic/OpenAI):** mulai sesederhana mungkin, ukur dengan eval sebelum menambah kompleksitas, dan jaga bahwa setiap penambahan (critique, refine, browser) harus membuktikan nilai lewat skor eval, bukan asumsi.

---

## 5. Daftar Sumber (URL valid)

**Panduan industri:**
1. Anthropic — Building Effective Agents: https://www.anthropic.com/engineering/building-effective-agents
2. Anthropic — Building Effective AI Agents (PDF, architecture patterns): https://resources.anthropic.com/hubfs/Building%20Effective%20AI%20Agents-%20Architecture%20Patterns%20and%20Implementation%20Frameworks.pdf
3. Anthropic (claude.dev blog) — A harness for every task: dynamic workflows in Claude Code: https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code
4. OpenAI — A Practical Guide to Building AI Agents: https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/
5. OpenAI — Learning Hub (guides index): https://openai.com/business/guides-and-resources/
6. Oracle — ReAct vs Plan & Execute: https://blogs.oracle.com/integration/react-vs-plan-execute-choosing-the-right-agent-thinking-pattern-in-oracle-integration
7. The AI Engineer — The 4 Single-Agent Patterns (ReAct, Plan-and-Execute, ReWOO, Reflexion): https://theaiengineer.substack.com/p/the-4-single-agent-patterns
8. Decagon — What is the ReAct Agent Pattern: https://decagon.ai/glossary/what-is-react-agent-pattern
9. Dev.to — ReAct vs Plan-and-Execute: A Practical Comparison: https://dev.to/jamesli/react-vs-plan-and-execute-a-practical-comparison-of-llm-agent-patterns-4gh9
10. Medium (G. Spacagna) — ReAct + Reflexion Agentic Design Patterns: https://gm-spacagna.medium.com/react-reflexion-agentic-design-patterns-for-explicit-reasoning-1bb60dcdb611

**Paper akademik:**
11. ReAct: Synergizing Reasoning and Acting in Language Models (ICLR 2023): https://arxiv.org/abs/2210.03629
12. Reflexion: Language Agents with Verbal Reinforcement Learning (NeurIPS 2023): https://arxiv.org/abs/2303.11366
13. Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena (NeurIPS 2023): https://arxiv.org/abs/2306.05685
14. Replacing Judges with Juries: Evaluating LLM Generations with a Panel of Diverse Models (PoLL): https://arxiv.org/abs/2404.18796
15. Itera-Web-Q — A Generative AI Tool for Constructing Web Frontend with Integration of Quality Feedback Loop (ACM): https://dl.acm.org/doi/pdf/10.1145/3816713.3818803
16. WebLoop — Learning the Loop, Not Just the Page: Execution-Grounded Loop Learning for Web Generation: https://arxiv.org/html/2610.11543

**Proyek open source (agent harness untuk web generation):**
17. Mnemo-mcp/Harness — GAN-loop Generator↔Evaluator untuk frontend: https://github.com/Mnemo-mcp/Harness
18. AgentSite — orchestrator multi-agent (PM → Designer → Developer↔Reviewer loop): https://github.com/jhd3197/AgentSite/blob/00e48798/agentsite/agents/orchestrator.py
19. GenieAI website-builder — agentic loop prompt→plan→generate→validate→iterate: https://github.com/SamadeshPoudel/GenieAI-website-builder
