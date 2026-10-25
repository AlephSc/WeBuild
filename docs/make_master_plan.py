# -*- coding: utf-8 -*-
"""WeBuild Master Plan — dokumen perencanaan eksekusi (bukan proposal)."""
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

ACCENT = RGBColor(0x1F, 0x4E, 0x79)
doc = Document()

def h1(t):
    p = doc.add_heading(t, 1)
    for r in p.runs: r.font.color.rgb = ACCENT
def h2(t):
    p = doc.add_heading(t, 2)
    for r in p.runs: r.font.color.rgb = ACCENT
def para(t, bold=False, italic=False, align=None, size=None):
    p = doc.add_paragraph(); r = p.add_run(t); r.bold = bold; r.italic = italic
    if size: r.font.size = Pt(size)
    if align: p.alignment = align
def bullets(items):
    for i in items: doc.add_paragraph(i, style='List Bullet')
def table(headers, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(headers)); t.style = 'Light Grid Accent 1'
    for i, h in enumerate(headers):
        c = t.rows[0].cells[i]; c.text = h
        for r in c.paragraphs[0].runs: r.bold = True
    for row in rows:
        cs = t.add_row().cells
        for i, v in enumerate(row): cs[i].text = str(v)
    if widths:
        for i, w in enumerate(widths):
            for row in t.rows: row.cells[i].width = Inches(w)

# ====== COVER ======
para("MASTER PLAN — DOKUMEN PERENCANAAN EKSEKUSI", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, size=14)
doc.add_paragraph()
para("WeBuild", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, size=32)
para("Web-Based Website Builder with Integrated AI Access Gateway", italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, size=12)
para("Blueprint eksekusi 5 bulan — hasil konsolidasi 25 review independen", align=WD_ALIGN_PARAGRAPH.CENTER, size=10)
doc.add_page_break()

# ====== 1 ======
h1("1. Keputusan Desain Terkunci (Locked Decisions)")
para("Keputusan berikut FINAL — diambil dari konsolidasi review, tidak dibahas ulang kecuali ada blocker nyata. Setiap keputusan dicatat alasannya (bahan jawab sidang).")
table(["#", "Keputusan", "Alasan (untuk sidang)"],
[
 ["D1", "Publish Tier 1 (subdomain /s/slug) = jalur utama, dikerjakan M2", "Momen nilai user & demo tercepat; nol konfigurasi untuk awam"],
 ["D2", "Tier 3 Vercel Integration = DIPOTONG dari scope; jadi roadmap di laporan", "Butuh review manual Vercel; ROI rendah; 3 reviewer sepakat potong"],
 ["D3", "Tier 2 GitHub OAuth = bonus M5, pakai Git Trees API (1 commit atomik)", "Approval instan, auto-deploy ke Vercel user; Trees API hindari bug sha/409"],
 ["D4", "Auth: httpOnly cookie + bcrypt + UUID untuk semua ID", "Standar keamanan; UUID anti-enumeration"],
 ["D5", "Sites: kolom draft_snapshot TERPISAH dari published_snapshot + site_revisions (cap 10)", "Rollback mustahil tanpa ini; retrofit mahal"],
 ["D6", "AI gateway: NON-STREAMING, structured output native (Gemini responseSchema / Groq json_object) + validasi zod + 1 retry", "Output pendek (<500 token); prompt-only JSON rapuh"],
 ["D7", "Migrasi gateway ke CF Workers = bonus opsional M4, bukan target", "YAGNI; M4 bulan paling padat"],
 ["D8", "Editor: form-per-block dulu; drag-drop (dnd-kit) = progressive enhancement M4", "Skema blok stabil dulu; drag-drop cuma lapisan UI"],
 ["D9", "Konten publish dirender dengan DOMPurify + semantic HTML + generateMetadata per slug", "Anti stored-XSS; share WA/IG profesional; web standards"],
 ["D10", "ai_providers = konstanta kode (bukan tabel) — admin hanya toggle enable/disable", "Provider cuma 2; over-modeling dihindari"],
 ["D11", "ToS + Privasi + tombol Laporkan + admin takedown = wajib M1/M3", "UU PDP & ITE; notice-and-takedown bikin defensible"],
 ["D12", "Freemium: tabel plans + field plan (toggle manual admin); payment integration SKIP", "Quota system = fondasi monetisasi; sandbox payment = distraksi"],
 ["D13", "Repo GitHub private dari hari 1 → public 2-3 minggu sebelum UKK; Issues/Projects serius", "History utuh = bukti proses; go-public tertunda anti-plagiarisme"],
 ["D14", "Editor desktop-only (pesan + copy link di mobile); site hasil WAJIB mobile-first", "Builder ≠ reader; mayoritas pengunjung UMKM dari HP"],
 ["D15", "Dark mode: hanya untuk editor WeBuild sendiri; site user terang saja", "Audit 2 kondisi x 5 template = mahal; rasio polish/jam rendah"],
], widths=[0.5, 3.2, 3.3])

# ====== 2 ======
h1("2. Arsitektur Final")
para("Vercel (Next.js: landing, editor, admin, REST API) → Neon PostgreSQL (data) + Cloudflare R2 (aset, presigned upload) + AI Gateway modul (verify → permission → quota atomik → forward → log) → Gemini/Groq. Publish: render dinamis /s/slug dengan revalidateTag; Tier 2 commit ke repo user via Git Trees API → Vercel user auto-deploy.")
bullets([
 "Semua API key AI di env vars Vercel — tidak pernah terekspos klien.",
 "Token GitHub user (Tier 2) terenkripsi AES env-key, ada tombol Disconnect.",
 "Sentry + /api/health (cek DB) + UptimeRobot; log JSON terstruktur 1 helper lib/log.ts.",
])

# ====== 3 ======
h1("3. Skema Database Final")
table(["Tabel", "Kolom Utama", "Catatan"],
[
 ["users", "id(uuid), name, email, password_hash, role, plan, is_active, tos_accepted_at", "plan: free/pro (toggle admin)"],
 ["sites", "id, owner_id, title, slug, draft_snapshot(jsonb), published_snapshot(jsonb), version, published_at, is_published", "partial unique index slug WHERE published_at IS NOT NULL; slug bentrok → auto-suffix -<shortid>"],
 ["site_revisions", "id, site_id, version, snapshot, created_at", "cap 10 revisi terakhir per site"],
 ["assets", "id, user_id, r2_key, url, content_type, size_bytes, created_at", "untuk cleanup orphan"],
 ["ai_permissions", "id, user_id, provider, daily_quota, quota_used, quota_date", "provider = enum bukan FK tabel"],
 ["ai_usage_logs", "id, user_id, provider, tokens_in, tokens_out, status, created_at", "retensi 30 hari + agregat bulanan; index (user_id, created_at)"],
 ["site_events", "id, user_id, site_id, event_type, created_at", "analytics self-hosted (privacy win); index (event_type, created_at)"],
 ["reports (laporan admin)", "aggregate _daily_stats (date, dau, sites, publishes, ai_requests)", "cron isi harian; dashboard baca 1 row/hari"],
], widths=[1.4, 3.3, 2.3])
para("Quota atomik (bahan sidang — race condition):", bold=True)
para("UPDATE ai_permissions SET quota_used = quota_used + 1 WHERE user_id=$1 AND provider=$2 AND quota_date=$3 AND quota_used < daily_quota RETURNING quota_used;  -- gagal = kuota habis; rollback decrement jika provider error.")

# ====== 4 ======
h1("4. Perancangan Blok (BlockRegistry)")
para("SATU file registry — form-per-block, preview, publish, dan AI generator semua makan dari sini: map type → { zod schema, form component, render component, ai prompt hint }. Tanpa ini, M4 = refactor menyeluruh.")
table(["Block type", "Field", "Catatan a11y/SEO"],
[
 ["hero", "heading, subheading, ctaLabel, ctaUrl, imageUrl, alt", "render <header><h1>; alt wajib"],
 ["text", "heading, body", "render <section>; body min 16px"],
 ["image", "url, alt, caption", "alt WAJIB — validasi blok sebelum publish"],
 ["button/link", "label, url", "touch target ≥44px"],
 ["gallery", "images[{url,alt}]", "grid responsive"],
 ["contact/wa", "phone, message", "tombol WA besar (konteks Indonesia)"],
], widths=[1.2, 2.4, 3.4])
para("Template = set CSS variables saja (--primary, --font-heading, --radius, --preset) — template baru = 10 baris JSON. Halaman internal /design-preview render semua block × template sebagai guard regresi visual.")

# ====== 5 ======
h1("5. REST API Final")
table(["Metode & Endpoint", "Akses", "Catatan"],
[
 ["POST /api/auth/register | login | logout", "publik", "checkbox ToS; rate limit login"],
 ["GET/POST /api/sites; GET/PUT/DELETE /api/sites/:id", "user (owner)", "cek ownership di setiap handler"],
 ["PUT /api/sites/:id/blocks", "user (owner)", "validasi zod per block via registry"],
 ["POST /api/assets/presign", "user", "presigned URL R2; upload langsung; magic bytes + max 2MB"],
 ["POST /api/sites/:id/publish", "user", "copy draft→published_snapshot, version+1, revalidateTag, validasi alt text"],
 ["POST /api/ai/generate", "user", "verify → permission → atomic quota → forward → log; structured output; fallback Gemini↔Groq; cap 4K in/800 out"],
 ["POST /api/reports/site/:slug", "publik", "tombol Laporkan di footer site"],
 ["GET /api/admin/users | providers | stats | export.csv", "admin", "dashboard; rasio & tren, bukan angka mentah"],
 ["GET /api/health", "publik", "SELECT 1; dipantau UptimeRobot"],
], widths=[3.0, 1.3, 2.7])

# ====== 5b ======
h1("5b. Plan & Batas Freemium (Free vs Plus)")
para("Dua plan saja — simpel, tanpa payment integration (keputusan D12). Upgrade = toggle manual oleh Admin (jalur 'kontak admin'). Enforcement = 1 middleware check yang membaca limits dari tabel plans — struktur kode tidak berubah saat nanti ditambah plan ketiga.")
table(["Fitur", "FREE", "PLUS"],
[
 ["Jumlah site aktif", "1", "10"],
 ["AI generate / hari", "10 request", "50 request"],
 ["Kuota upload", "50 MB total", "500 MB total"],
 ["Ukuran per file", "2 MB", "5 MB"],
 ["Badge 'Dibuat dengan WeBuild'", "Wajib (mesin word-of-mouth)", "Opsional / bisa dihapus"],
 ["Publish", "Subdomain /s/slug", "Subdomain + Tier 2 GitHub auto-deploy"],
 ["Undo/revisi tersimpan", "5 revisi", "10 revisi"],
], widths=[2.6, 2.2, 2.2])
bullets([
 "Enforcement: cek `sites` count saat create; quota AI sudah atomic (tinggal baca limit dari plans); cek total size_bytes di `assets` saat upload.",
 "Field `plan` di users + tabel `plans` (id, name, limits jsonb) — plan baru = 1 row insert.",
 "Halaman 'Upgrade' di app: tabel perbandingan + tombol 'Hubungi Admin' (bukan tombol bayar).",
 "Business model ini ditulis di laporan sebagai DESAIN (asumsi biaya Neon/R2/AI per user, break-even) — bukan kode.",
])

# ====== 6 ======
h1("6. Risk Register & Trigger Cut")
table(["Risiko", "Prob.", "Dampak", "Trigger & Aksi Cut"],
[
 ["Rate limit Gemini saat demo", "sedang", "tinggi", "fallback Groq otomatis; kalau dua-duanya limit: mode template non-AI (tetap jalan)"],
 ["Waktu molor >2 minggu di M3-M4", "sedang", "tinggi", "CUT drag-drop dulu → lalu CF Workers → Tier 2; Tier 1 + laporan tetap aman"],
 ["Neon cold start saat demo", "sedang", "sedang", "ping warm-up 5 menit sebelum giliran; connection retry"],
 ["Semua jalan lokal, rusak di Vercel", "tinggi", "sedang", "protokol: vercel build lokal → cek env → baca build log → rollback deployment stabil (JANGAN debug live)"],
 ["Dituduh copy AI-generated", "rendah", "tinggi", "git history granular + ADR + README jujur: 'dibantu AI sebagai tool, semua keputusan & debugging saya'"],
 ["Kebocoran API key via repo", "rendah", "tinggi", ".gitignore hari 1; GitHub secret scanning + push protection; semua key di env Vercel"],
], widths=[1.9, 0.8, 0.8, 3.5])

# ====== 7 ======
h1("7. Fase Eksekusi Granular (13 Fase — Anti Terburu-buru)")
para("Prinsip: SETIAP fase kecil, satu fokus, ada gate yang bisa diverifikasi, dan berhenti di titik stabil. Fase berikutnya baru dimulai setelah gate lolos. Perkiraan waktu = patokan untuk ritme 8-10 jam/minggu (siswa kelas 12), bukan sprint.")
h2("FASE 1 — Fondasi Infra (minggu 1-2)")
bullets([
 "Init Next.js + TypeScript + Tailwind; repo GitHub (private, conventional commits); deploy pertama ke Vercel (cuma landing kosong).",
 "Buat project Neon + koneksi; tabel users + plans (migration Prisma pertama); env vars rapi di Vercel.",
 "Sentry + /api/health + UptimeRobot + lib/log.ts (JSON logger).",
])
para("GATE 1: deploy live; /api/health mengembalikan {ok:true, db:up}; Sentry menerima test error; git log bersih.", bold=True)
h2("FASE 2 — Autentikasi (minggu 3-4)")
bullets([
 "Register (checkbox ToS, zod validation), login, logout; bcrypt + httpOnly cookie session; middleware role (admin/user).",
 "Halaman ToS & Privasi (UU PDP); akun admin pertama via seed script.",
 "Rate limit login sederhana (per-IP).",
])
para("GATE 2: daftar→login→logout live di Vercel; password di DB ter-hash (cek manual); protected route menolak tanpa sesi.", bold=True)
h2("FASE 3 — Site & Blok: Data (minggu 5-6)")
bullets([
 "Skema lengkap: sites (draft_snapshot terpisah), site_revisions, assets, site_events. Migration + seed data.",
 "BlockRegistry v1: zod schema + render component untuk 6 tipe blok (hero/text/image/button/gallery/contact).",
 "CRUD API /api/sites + /api/sites/:id/blocks — cek ownership di setiap handler; unit test slug generator.",
])
para("GATE 3: CRUD site & blok via API teruji (curl/REST client); validasi zod menolak blok rusak; IDOR test (user A tak bisa edit site user B) gagal dengan 403.", bold=True)
h2("FASE 4 — Editor v1 (minggu 7-8)")
bullets([
 "Editor 2-panel: daftar form blok (kiri) + preview route /preview/[id] (kanan). State: Zustand + undo snapshot (max 50).",
 "Seed template otomatis saat site dibuat (hero+text+button terisi) — anti blank canvas.",
 "Enforcement plan: site count (Free=1); halaman Upgrade (Hubungi Admin).",
])
para("GATE 4: buat site → template muncul → edit blok → undo jalan → user nyata pertama (teman) selesai edit tanpa bantuan.", bold=True)
h2("FASE 5 — Upload Aset (minggu 9)")
bullets([
 "Presigned URL R2 + upload langsung; kompres klien (canvas, max 1200px) + magic bytes + limit per plan (2MB/5MB).",
 "Tabel assets terisi (r2_key, size_bytes) untuk kuota & cleanup.",
])
para("GATE 5: upload foto dari HP (capture kamera) dan desktop; file >limit ditolak dengan pesan jelas; gambar tampil di editor.", bold=True)
h2("FASE 6 — PUBLISH Tier 1 (minggu 10-11) ⭐ momen terbesar")
bullets([
 "POST /api/sites/:id/publish: validasi (alt text wajib), copy draft→published_snapshot, version+1, site_revisions cap 5/10.",
 "Halaman publik /s/[slug]: DOMPurify, semantic HTML, generateMetadata, next/image (remote pattern R2), revalidateTag.",
 "Sitemap + robots dinamis; slug bentrok → auto-suffix; footer badge 'Dibuat dengan WeBuild' (Free).",
])
para("GATE 6: site ter-publish bisa dibuka di HP penguji; share ke WA tampil judul+gambar; XSS test (script inject di text block) TIDAK dieksekusi di halaman publik.", bold=True)
h2("FASE 7 — Uji Pengguna Nyata (minggu 12)")
bullets([
 "Rekrut 3-5 teman/UMKM: daftar → build → publish sendiri, TANPA bantuan. Amati di mana mereka stuck.",
 "Perbaiki 3 temuan terbesar (biasanya: istilah membingungkan, error tidak jelas, flow publish tersembunyi).",
 "Mulai tulis Bab 4 (implementasi) — screenshot tiap fitur yang selesai.",
])
para("GATE 7: 3 user nyata selesai publish sendiri; daftar temuan UX terdokumentasi; Bab 1-3 laporan 60% jadi.", bold=True)
h2("FASE 8 — AI Gateway (minggu 13-14)")
bullets([
 "POST /api/ai/generate: verify → permission → quota atomik (baca limit dari plans) → structured output (responseSchema) → validasi zod + 1 retry → log tokens.",
 "Fallback Gemini↔Groq + pesan sopan saat limit; UI AI di editor: hasil tampil dulu, tombol 'Pakai' (jangan auto-overwrite).",
 "Uji atomic: 2 request paralel melewati batas — harus tepat 1 yang lolos.",
])
para("GATE 8: 10x generate berturut tanpa gagal; kuota terbukti atomic; log tokens tampil di DB; user uji coba fitur AI tanpa bingung.", bold=True)
h2("FASE 9 — Moderasi & Laporan (minggu 15)")
bullets([
 "Tombol 'Laporkan' di footer site publik → antrean admin → aksi unpublish (notice & takedown).",
 "CSV export admin (site_events, ai_usage); retensi log 30 hari.",
])
para("GATE 9: laporan konten → unpublish jalan end-to-end; CSV ter-download dan terbuka di Excel.", bold=True)
h2("FASE 10 — Admin Dashboard (minggu 16-17)")
bullets([
 "4 metrik (DAU, sites, publish rate, AI usage) dari _daily_stats; chart SVG murni (tanpa recharts); presentasi rasio & tren.",
 "Kelola user (aktif/nonaktif, toggle plan), toggle provider AI.",
 "Seed time-series 8 minggu realistis (spike saat AI dirilis).",
])
para("GATE 10: dashboard live dengan data; admin bisa mencabut akses AI user X dan user X langsung kena 403 (demo sidang!).", bold=True)
h2("FASE 11 — Template & Polish (minggu 18-19)")
bullets([
 "3-5 template via CSS variables (10 baris JSON per template) + halaman /design-preview (guard regresi visual).",
 "Landing page WeBuild (pakai template sendiri sebagai demo hidup); logo wordmark + favicon SVG.",
 "Gallery 8-12 site nyata di landing.",
])
para("GATE 11: template baru terpasang tanpa ubah kode blok; Lighthouse site hasil user ≥90; gallery terisi site nyata (bukan dummy).", bold=True)
h2("FASE 12 — Tier 2 GitHub Auto-Deploy (minggu 20-21) — BONUS")
bullets([
 "GitHub OAuth App (scope public_repo); token terenkripsi; Settings page + Disconnect.",
 "Publish v2: render HTML statis → Git Trees API (1 commit atomik) → repo user → Vercel user auto-deploy.",
 "Panduan bergambar 'hubungkan repo ke Vercel' (sekali seumur hidup user).",
])
para("GATE 12: user uji connect GitHub → publish → site muncul di namauser.vercel.app; Disconnect menghapus token dari DB.", bold=True)
h2("FASE 13 — Sidang (minggu 22+)")
bullets([
 "Laporan PDF final (Bab 5 pengujian: black-box ≥15 kasus); Vitest 3 target + Playwright 5 smoke + test 360px.",
 "Load test H-2 (k6 50 VU, p95 <2s); video demo cadangan; repo → public; gladi dengan guru (simulasi tanya-jawab).",
 "Toolkit demo 5 menit: UptimeRobot → health → Sentry → rollback.",
])
para("GATE 13: gladi bersih; setiap pertanyaan 'kenapa' terjawab lisan 2 menit tanpa lihat kode; video cadangan aman di HP/flashdisk.", bold=True)
h2("Peta Fase → Bulan (ringkas)")
table(["Bulan", "Fase", "Jika molor?"],
[
 ["M1", "F1-F2", "skip tidak ada — fondasi wajib matang"],
 ["M2", "F3-F5", "tekan: gabung F3+F4 (CRUD+editor bareng)"],
 ["M3", "F6-F7", "CORE: publish wajib jalan; uji user boleh dikecilkan jadi 2 orang"],
 ["M4", "F8-F11", "urutan cut: F11 template→tinggal 2 → F10 dashboard→dashboard sederhana → F9 bisa manual via DB"],
 ["M5", "F12-F13", "F12 GitHub = CUT pertama; laporan & testing TIDAK BOLEH dipotong"],
], widths=[0.8, 1.4, 4.8])

# ====== 7b ======
h1("7b. PRD per Fase (User Stories & Acceptance Criteria)")
para("Format: Sebagai [role], saya ingin [fitur], sehingga [manfaat]. Acceptance criteria (AC) = kondisi terverifikasi yang harus benar SEMUA sebelum fase dinyatakan selesai (melengkapi Gate di bab 7).")
h2("PRD F1 — Fondasi Infra")
bullets([
 "SBAGAI dev, SAYA INGIN deploy otomatis tiap push ke main, SEHINGGA tidak ada deploy manual. AC: push kosong → Vercel build sukses; URL produksi live.",
 "SBAGAI dev, SAYA INGIN health check yang mengecek DB, SEHINGGA tahu cepat kalau Neon bermasalah. AC: GET /api/health → {ok:true, db:'up'}; senghaja salah DATABASE_URL → db:'down' + Sentry mencatat.",
 "SBAGAI dev, SAYA INGIN log JSON terstruktur, SEHINGGA mudah filter di Vercel. AC: semua route kritis log {ts, level, msg, userId?, slug?, durationMs?}.",
])
h2("PRD F2 — Autentikasi")
bullets([
 "SEBAGAI pengunjung, SAYA INGIN daftar dengan email+password + centang ToS, SEHINGGA punya akun. AC: email duplikat/invalid ditolak zod dengan pesan Indonesia; tos_accepted_at terisi; password bcrypt (tidak plaintext di DB).",
 "SEBAGAI user, SAYA INGIN login/logout dengan sesi aman, SEHINGGA akun saya tidak dibajak. AC: cookie httpOnly+SameSite; logout menghapus sesi; 5x password salah dalam 1 menit → diblok sementara (rate limit).",
 "SEBAGAI admin, SAYA INGIN halaman admin terlindungi, SEHINGGA hanya saya yang bisa akses. AC: role user biasa buka /admin → redirect 403.",
])
h2("PRD F3 — Site & Blok (Data)")
bullets([
 "SEBAGAI user, SAYA INGIN membuat site yang otomatis terisi template dasar, SEHINGGA tidak mulai dari kanvas kosong. AC: site baru punya draft_snapshot berisi blok hero+text+button contoh.",
 "SEBAGAI user, SAYA INGIN menambah/mengubah/menghapus blok, SEHINGGA halaman saya sesuai keinginan. AC: 6 tipe blok tervalidasi zod; blok rusak (field kosong/wajib hilang) ditolak 400 dengan pesan jelas.",
 "SEBAGAI user, SAYA INGIN site saya tidak bisa diubah orang lain, SEHINGGA aman. AC: user B PUT site milik user A → 403 (bukan 500).",
])
h2("PRD F4 — Editor v1")
bullets([
 "SEBAGAI user, SAYA INGIN melihat hasil editan langsung di samping form, SEHINGGA tidak perlu save untuk tahu hasilnya. AC: perubahan form blok tampil di preview kanan <1 detik (route /preview/[id]).",
 "SEBAGAI user, SAYA INGIN undo kesalahan, SEHINGGA berani eksplorasi. AC: tombol undo mengembalikan ≤50 langkah; redo jalan.",
 "SEBAGAI user Free, SAYA INGIN tahu batas paket saya, SEHINGGA tidak kaget. AC: buat site ke-2 sebagai Free → pesan jelas + tautan halaman Upgrade.",
])
h2("PRD F5 — Upload Aset")
bullets([
 "SEBAGAI user, SAYA INGIN upload foto dari HP/desktop, SEHINGGA site saya bergambar. AC: input accept image/* capture; gambar dikompres klien ≤1200px; tampil di editor.",
 "SEBAGAI user, SAYA INGIN ditolak dengan sopan bila file salah, SEHINGGA paham harus apa. AC: file >limit plan → pesan 'Maksimal 2MB untuk paket Free'; file bukan gambar (magic bytes) → ditolak.",
])
h2("PRD F6 — Publish (momen terbesar)")
bullets([
 "SEBAGAI user, SAYA INGIN publish sekali klik, SEHINGGA website saya bisa dibagikan. AC: publish sukses → URL /s/slug aktif; share ke WA tampil judul+gambar (og tags); badge 'Dibuat dengan WeBuild' muncul (Free).",
 "SEBAGAI user, SAYA INGIN edit setelah publish tanpa rusak yang sudah live, SEHINGGA aman bereksperimen. AC: perubahan draft TIDAK tampil di /s/slug sampai publish lagi (published_snapshot terpisah).",
 "SEBAGAI user, SAYA INGIN rollback bila publish baru jelek, SEHINGGA tidak panik. AC: kembali ke revisi sebelumnya dari daftar site_revisions.",
 "SEBAGAI pengunjung, SAYA INGIN halaman cepat & aman, SEHINGGA nyaman. AC: XSS inject '<script>' di text block tidak tereksekusi di /s/slug (DOMPurify); LCP baik (next/image); edit-published → revalidateTag menyegarkan <10 detik.",
])
h2("PRD F7 — Uji Pengguna Nyata")
bullets([
 "SEBAGAI pemilik produk, SAYA INGIN 3-5 orang asing mencoba sendiri, SEHINGGA tahu masalah nyata. AC: 3 user selesai daftar→build→publish TANPA bantuan; semua titik bingung tercatat; 3 teratas diperbaiki.",
])
h2("PRD F8 — AI Gateway")
bullets([
 "SEBAGAI user, SAYA INGIN AI menulis konten blok untuk saya, SEHINGGA cepat jadi. AC: hasil AI tampil sebagai pratinjau + tombol 'Pakai' (tidak auto-overwrite); 10x berturut-turut tanpa error.",
 "SEBAGAI user Free, SAYA INGIN tahu sisa kuota AI, SEHINGGA bisa atur pemakaian. AC: badge sisa request/hari terlihat di UI; habis → pesan jelas 'Kuota AI hari ini habis, kembali besok'.",
 "SEBAGAI admin, SAYA INGIN kuota tidak bisa dilewati, SEHINGGA fair. AC: 2 request paralel saat sisa 1 → tepat SATU yang sukses (atomic).",
])
h2("PRD F9 — Moderasi & Laporan")
bullets([
 "SEBAGAI pengunjung, SAYA INGIN melaporkan site berbahaya, SEHINGGA platform aman. AC: tombol Laporkan di footer /s/slug → masuk antrean admin.",
 "SEBAGAI admin, SAYA INGIN unpublish site bermasalah, SEHINGGA cepat bertindak. AC: aksi unpublish → /s/slug jadi 404 dalam <10 detik (revalidateTag).",
 "SEBAGAI admin, SAYA INGIN export data, SEHINGGA bisa analisis di Excel. AC: CSV ter-download, terbuka di Excel, berisi header benar.",
])
h2("PRD F10 — Admin Dashboard")
bullets([
 "SEBAGAI admin, SAYA INGIN melihat tren pemakaian, SEHINGGA tahu kesehatan produk. AC: 4 metrik (DAU, sites, publish rate, AI usage) tampil dengan tren 8 minggu (rasio + delta, bukan angka mentah).",
 "SEBAGAI admin, SAYA INGIN mencabut akses AI user, SEHINGGA bisa menghukum penyalahguna. AC: toggle off → request AI user tsb ditolak 403 pada percobaan berikutnya (tanpa re-login).",
])
h2("PRD F11 — Template & Polish")
bullets([
 "SEBAGAI user, SAYA INGIN memilih template menarik, SEHINGGA site saya terlihat profesional. AC: 3-5 template bergaya neobrutalism (lihat bab 7c) terpasang; ganti template tidak mengubah isi blok.",
 "SEBAGAI pengunjung landing, SAYA INGIN melihat bukti nyata, SEHINGGA percaya. AC: gallery 8-12 site nyata dengan screenshot + kutipan user.",
])
h2("PRD F12 — Tier 2 GitHub (Bonus)")
bullets([
 "SEBAGAI user Plus, SAYA INGIN publish ke akun Vercel saya sendiri, SEHINGGA punya domain pro. AC: connect GitHub 1x → publish → site live di namauser.vercel.app (via Git Trees API, 1 commit atomik).",
 "SEBAGAI user, SAYA INGIN bisa memutus koneksi, SEHINGGA punya kontrol. AC: Disconnect → token terhapus dari DB → publish Tier 2 dinonaktifkan rapi.",
])

# ====== 7c ======
h1("7c. Desain UI/UX — Neobrutalism (acuan: cloud.mui.skin)")
para("Arah visual WeBuild: neobrutalism modern bergaya Nauval Cloud — dark navy pekat, border tegas 2px, hard shadow tanpa blur, aksen warna berani. Terukur langsung dari situs acuan (computed styles):")
table(["Token", "Nilai", "Pemakaian"],
[
 ["--bg", "#04101B (navy pekat)", "background utama"],
 ["--surface", "#081B28", "panel/section"],
 ["--fg", "#FFF1C8 (krem hangat)", "teks utama — kontras tinggi di navy"],
 ["--muted", "#91AAB2", "teks sekunder"],
 ["--accent-primary", "#F7CF76 (kuning)", "CTA utama, badge, highlight"],
 ["--accent-success", "#64E6BE (mint)", "tombol deploy/publish, status sukses"],
 ["--accent-danger", "#E95F46 (koral)", "lapor, error, destruktif"],
 ["--border", "2px solid #061421 (atau warna aksen)", "SEMUA kartu, tombol, badge"],
 ["--radius", "14px (tombol/kartu besar); 0px (badge kecil)", "sudut membulat khas"],
 ["--shadow-hard", "4px 4px 0 #00070C (offset solid, TANPA blur)", "kartu & tombol — inti neobrutalism"],
 ["--shadow-hard-sm", "2px 2px 0 #00070C", "elemen kecil/secondary"],
 ["--font-heading", "Space Grotesk 700 (h1 72px / h2 36px)", "judul — tebal, geometris"],
 ["--font-body", "Inter (body 16px min)", "teks & form"],
 ["--font-mono", "JetBrains Mono / monospace", "URL slug, kode, log"],
], widths=[1.5, 2.6, 2.9])
h2("Pola Komponen")
bullets([
 "Tombol: border 2px gelap + hard shadow 4px; hover/aktif: translate(-2px,-2px) & shadow membesar ke 6px (efek 'terangkat'); disabled: shadow hilang, warna muted.",
 "Kartu/stat: border 2px + hard shadow; angka besar font Space Grotesk; label kecil uppercase Inter.",
 "Badge/status: kotak (radius 0) warna aksen penuh, teks gelap — persis badge 'INSTANT DEPLOY' acuan (kuning + shadow koral 4px).",
 "Form: input bg surface + border 2px; focus: border kuning + shadow kuning 3px; error: border koral + pesan bawah.",
 "Toast/notifikasi: kartu kecil border 2px + hard shadow, warna sesuai jenis (mint sukses / koral error / kuning info).",
 "Detail khas acuan: garis putus-putus pemisah section, panel 'terminal CLI' dengan font mono untuk log/status deploy (juga dipakai di admin dashboard).",
])
h2("Aturan Khusus untuk WeBuild")
bullets([
 "Editor WeBuild & dashboard admin: neobrutalism penuh (identitas produk).",
 "SITE HASIL USER: template neobrutalism versi TERANG (bg krem/putih #FFF8E7, teks navy, border navy 2px, hard shadow navy) — agar site UMKM terlihat cerah & ramah, tetap satu keluarga desain. Kontras tetap ≥4.5:1 (a11y D-review).",
 "Motion: transisi cepat 100-150ms (translate/shadow) — bukan animasi lembut ala skeuomorphism.",
 "Mobile: hard shadow & border aman di layar kecil; pastikan touch target tetap ≥44px (shadow tidak dihitung sebagai target).",
])
para("Implementasi: token di atas jadi CSS variables global (globals.css) + utility class Tailwind (shadow-hard, border-2); halaman /design-preview (F11) render semua komponen & blok sebagai guard regresi visual. Situs acuan tetap sebagai moodboard utama.", italic=True)

h1("8. Rencana Pengujian")
bullets([
 "Vitest — HANYA 3 target: slug generator (collision), quota atomik, sanitize output. ~1 jam setup.",
 "Playwright — 5 smoke test: login → create → upload → publish → akses /s/slug. Plus 1 test viewport 360px (no horizontal scroll).",
 "Black-box manual — tabel: No | Skenario | Input | Expected | Actual | Status; diisi SEIRING fitur selesai tiap bulan (bukan direkap akhir). Kasus wajib: XSS inject di text block, upload >2MB, quota habis mid-generate, slug bentrok, permission dicabut mid-session.",
 "Load sanity — k6 50 VU ke /s/slug, H-2 sebelum demo, target p95 <2s.",
])
# ====== 9 ======
h1("9. Ritme Kerja & Proses")
bullets([
 "45-90 menit/hari kerja biasa; 2-3 jam Sabtu-Minggu; Minggu malam LIBUR penuh (anti-burnout bulan 3).",
 "Conventional commits (feat:/fix:); branch per fitur; PR ke diri sendiri dengan checklist 5 poin.",
 "Mingguan 30 menit: cek log Vercel + Sentry, update risk register, tulis 1 ADR-lite (docs/adr/NN: Konteks/Keputusan/Alternatif/Konsekuensi, 5 baris).",
 "Konsultasi guru: akhir M1 (validasi scope), akhir M2 (demo fondasi), akhir M4 (simulasi tanya-jawab ala sidang).",
 "Setiap fitur: bisa dijelaskan lisan 2 menit tanpa lihat kode — kalau tidak, belum selesai.",
])
# ====== 10 ======
h1("10. Demo Day Kit")
bullets([
 "5 menit sebelum: UptimeRobot hijau → curl /api/health → Sentry bersih 24 jam → deployment READY. Rusak = ROLLBACK, bukan debug.",
 "Akun dummy (admin + user) berisi data; 8 minggu time-series realistis (spike saat AI dirilis, weekend turun) — presentasikan RASIO & TREN, bukan angka mentah.",
 "Video demo offline + screenshot semua tier sebagai cadangan.",
 "Cerita demo: '3 UMKM nyata sekarang jualan online karena WeBuild' — bukan daftar fitur.",
])

doc.save("WeBuild_Master_Plan.docx")
print("saved")
