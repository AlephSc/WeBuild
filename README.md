# WeBuild

> **Web-Based Website Builder with Integrated AI Access Gateway** — proyek Uji Kompetensi Keahlian (UKK) RPL.

WeBuild memungkinkan siapa pun membuat website dari blok-blok siap pakai tanpa ngoding — dengan asisten AI bantu konten, publish sekali klik, dan gateway AI dengan manajemen akses & kuota.

## Status

📅 **Perencanaan selesai — belum mulai implementasi** (target eksekusi: 5 bulan, 13 fase bertingkat)

| Dokumen | Isi |
|---|---|
| [`WeBuild_Master_Plan.docx`](WeBuild_Master_Plan.docx) | Blueprint lengkap: keputusan desain terkunci (D1–D15), arsitektur, skema DB, plan Free/Plus, BlockRegistry, REST API, 13 fase + gate, **PRD per fase**, desain UI neobrutalism, risk register, rencana pengujian, demo kit |
| [`webuild_mockup.html`](webuild_mockup.html) | Mockup interaktif 3 view: landing, editor + preview, site hasil user (buka di browser) |
| [`docs/make_master_plan.py`](docs/make_master_plan.py) | Skrip generator Master Plan (revisi dokumen = edit lalu jalankan ulang) |
| [`docs/make_proposal.py`](docs/make_proposal.py) | Skrip generator proposal ide (versi yang disetujui guru) |

## Stack (rencana)

Next.js + TypeScript · Vercel (Hobby) · PostgreSQL (Neon) · Cloudflare R2 · AI Gateway (Gemini/Groq free tier, structured output) · GitHub OAuth (Tier 2, bonus)

## Desain

Neobrutalism — acuan [cloud.mui.skin](https://cloud.mui.skin): dark navy `#04101B`, border 2px, hard shadow `4px 4px 0` (tanpa blur), aksen kuning/mint/koral, Space Grotesk + Inter. Site hasil user memakai versi terang (krem). Token lengkap di bab 7c Master Plan.

## Fase Berikutnya

1. **F1 — Fondasi Infra**: init Next.js + repo + deploy Vercel + Neon + Sentry + health check
2. Gate per fase dipenuhi sebelum lanjut (lihat bab 7 & 7b Master Plan)

---
Dibangun oleh Aleph · UKK XII RPL
