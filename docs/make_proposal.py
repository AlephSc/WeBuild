# -*- coding: utf-8 -*-
"""Generate dokumen proposal WeBuild untuk UKK (Word .docx)."""
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

ACCENT = RGBColor(0x1F, 0x4E, 0x79)
doc = Document()

# ---------- Helpers ----------
def h1(text):
    p = doc.add_heading(text, level=1)
    for r in p.runs: r.font.color.rgb = ACCENT
    return p

def h2(text):
    p = doc.add_heading(text, level=2)
    for r in p.runs: r.font.color.rgb = ACCENT
    return p

def para(text, bold=False, italic=False, align=None, size=None):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.bold = bold; r.italic = italic
    if size: r.font.size = Pt(size)
    if align: p.alignment = align
    return p

def bullets(items, style='List Bullet'):
    for it in items:
        doc.add_paragraph(it, style=style)

def table(headers, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = 'Light Grid Accent 1'
    for i, h in enumerate(headers):
        cell = t.rows[0].cells[i]
        cell.text = h
        for r in cell.paragraphs[0].runs: r.bold = True
    for row in rows:
        cells = t.add_row().cells
        for i, v in enumerate(row):
            cells[i].text = str(v)
    if widths:
        for i, w in enumerate(widths):
            for row in t.rows:
                row.cells[i].width = Inches(w)
    return t

# ---------- Cover ----------
para("PROPOSAL IDE PROYEK", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, size=14)
para("UJI KOMPETENSI KEAHLIAN (UKK)", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, size=14)
para("Rekayasa Perangkat Lunak (RPL)", align=WD_ALIGN_PARAGRAPH.CENTER, size=12)
doc.add_paragraph()
para("WeBuild", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, size=32)
para("Web-Based Website Builder with Integrated AI Access Gateway",
     italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, size=13)
doc.add_paragraph()
para("Disusun oleh:", align=WD_ALIGN_PARAGRAPH.CENTER)
para("Nama  : ____________________________", align=WD_ALIGN_PARAGRAPH.CENTER)
para("Kelas : XII Rekayasa Perangkat Lunak", align=WD_ALIGN_PARAGRAPH.CENTER)
para("Sekolah : ____________________________", align=WD_ALIGN_PARAGRAPH.CENTER)
para("Tahun Ajaran : 20____/20____", align=WD_ALIGN_PARAGRAPH.CENTER)
doc.add_page_break()

# ---------- 1. Ringkasan ----------
h1("1. Ringkasan Proyek")
para("WeBuild adalah platform berbasis web yang memungkinkan pengguna membangun dan "
     "menerbitkan website sederhana tanpa menulis kode, melalui sistem penyusunan blok "
     "(block-based builder). Platform ini dilengkapi asisten AI bawaan untuk membantu "
     "pembuatan konten, yang pengaksesannya dikelola melalui AI Access Gateway — sebuah "
     "lapisan router yang mengatur izin, kuota, dan pencatatan penggunaan layanan AI "
     "oleh setiap pengguna.")
para("Seluruh sistem dibangun dengan REST API, basis data relasional, autentikasi "
     "multi-role (Admin dan User), penyimpanan berkas (object storage), serta laporan "
     "statistik — sehingga memenuhi kriteria penilaian pengembangan perangkat lunak.")

# ---------- 2. Latar Belakang ----------
h1("2. Latar Belakang")
bullets([
    "Banyak orang (pelaku UMKM, organisasi, siswa) membutuhkan website sederhana namun tidak memiliki kemampuan pemrograman web.",
    "Layanan website builder komersial (Wix, Squarespace) berbayar dan tidak terbuka untuk dipelajari cara kerjanya secara teknis.",
    "Penggunaan layanan AI (seperti LLM) yang menyebar tanpa pengelolaan berisiko: API key terekspos, penggunaan tidak terkontrol, dan biaya membengkak.",
    "Industri menerapkan pola serupa (API Gateway / AI Router, mis. OpenRouter dan LiteLLM) untuk mengelola akses ke berbagai penyedia AI secara terpusat dan aman.",
    "Oleh karena itu, WeBuild dikembangkan sebagai pembuktian konsep (proof of concept) website builder sekaligus AI gateway dalam satu platform.",
])

# ---------- 3. Rumusan Masalah & Tujuan ----------
h1("3. Rumusan Masalah")
bullets([
    "Bagaimana membangun platform web yang memungkinkan pengguna membuat website tanpa keterampilan coding?",
    "Bagaimana mengelola akses ke layanan AI pihak ketiga secara aman, terpusat, dan terukur?",
    "Bagaimana mencatat aktivitas penggunaan sistem untuk kebutuhan laporan dan evaluasi?",
])

h2("Tujuan")
bullets([
    "Menghasilkan aplikasi web builder dengan editor blok dan fitur pratinjau serta publikasi.",
    "Menghasilkan AI Access Gateway dengan manajemen penyedia AI (provider), izin akses, dan kuota per pengguna.",
    "Menghasilkan REST API yang terdokumentasi untuk seluruh operasi sistem.",
    "Menghasilkan laporan statistik penggunaan (jumlah website, aktivitas, pemakaian AI).",
])

# ---------- 4. Fitur ----------
h1("4. Daftar Fitur")
h2("4.1 Peran Admin")
bullets([
    "Login dan autentikasi (email + password).",
    "Manajemen pengguna: melihat, mengaktifkan/nonaktifkan akun.",
    "Manajemen penyedia AI (AI Provider): menambah/mengedit/menghapus konfigurasi provider (mis. Gemini, Groq) beserta kunci API yang disimpan aman di sisi server.",
    "Manajemen izin akses: menetapkan AI mana yang boleh dipakai oleh role/user tertentu (access control).",
    "Pengaturan kuota pemakaian AI per pengguna per hari.",
    "Dashboard laporan: jumlah pengguna, jumlah website dibuat, statistik pemakaian AI, ekspor CSV.",
], )
h2("4.2 Peran Pengguna (User)")
bullets([
    "Registrasi dan login (email + password).",
    "Membuat, mengedit, dan menghapus website (CRUD) yang tersusun dari blok-blok konten: judul, teks, gambar, tombol, galeri, dsb.",
    "Upload gambar/aset untuk website (tersimpan di object storage).",
    "Asisten AI: menghasilkan teks/konten untuk blok melalui gateway (sesuai izin dan kuota).",
    "Pratinjau website dan publikasi ke subdomain platform (mis. webbuild.vercel.app/s/nama).",
    "Melihat riwayat pemakaian AI miliknya sendiri.",
])
h2("4.3 Fitur Sistem")
bullets([
    "REST API untuk semua operasi (autentikasi, CRUD, publikasi, proxy AI).",
    "Public API untuk memanggil AI melalui router dengan verifikasi token, cek izin, dan pencatatan log.",
    "Penyimpanan berkas pada Cloudflare R2 Object Storage.",
    "Basis data PostgreSQL (Neon) untuk seluruh data transaksional.",
])

# ---------- 5. Teknologi ----------
h1("5. Teknologi yang Digunakan")
table(
    ["Komponen", "Teknologi", "Keterangan"],
    [
        ["Frontend & Backend", "Next.js (React, Node.js)", "Satu framework untuk UI dan REST API"],
        ["Frontend Hosting", "Vercel (Hobby, gratis)", "Deploy otomatis dari GitHub"],
        ["API Router / AI Gateway", "Node.js pada server free-tier (BotKeep)", "Verifikasi akses, proxy ke provider AI, rate limit, logging"],
        ["Basis Data", "PostgreSQL (Neon, free tier)", "Basis data relasional di cloud"],
        ["Object Storage", "Cloudflare R2 (free tier)", "Gambar/aset yang diunggah pengguna"],
        ["Autentikasi", "Email + password (JWT/session)", "Dapat diperluas ke Firebase Auth"],
        ["Asisten AI", "Google Gemini / Groq (free tier)", "Generate konten; akses diatur gateway"],
        ["Version Control", "GitHub", "Repositori proyek dan CI/CD ke Vercel"],
    ],
    widths=[1.7, 2.2, 2.6],
)

# ---------- 6. Arsitektur ----------
h1("6. Arsitektur Sistem")
para("Skema arsitektur tingkat tinggi:", bold=True)
para("Pengguna/Peramban  ->  [ Vercel: Frontend + Admin Panel ]  ->  [ BotKeep: AI Router/Gateway ]  "
     "->  [ Penyedia AI: Gemini / Groq ]\n"
     "WeBuild (Vercel) juga terhubung langsung ke [ PostgreSQL (Neon) ] untuk basis data dan "
     "[ Cloudflare R2 ] untuk penyimpanan berkas.")
bullets([
    "Kunci API penyedia AI hanya tersimpan pada lapisan gateway (server), tidak pernah terekspos ke peramban.",
    "Setiap permintaan AI diverifikasi: token pengguna -> izin akses -> sisa kuota -> pencatatan log -> forward ke penyedia AI.",
    "Basis data dan berkas berada di layanan terpisah sehingga server router tetap ringan (sesuai batas 2 GB RAM / 150% vCPU).",
])

# ---------- 7. Database ----------
h1("7. Rancangan Basis Data (ERD Ringkas)")
table(
    ["Tabel", "Atribut Utama", "Keterangan"],
    [
        ["users", "id, name, email, password_hash, role, is_active", "Akun Admin & User"],
        ["sites", "id, user_id, title, slug, config_json, is_published", "Website milik user (relasi ke users)"],
        ["blocks", "id, site_id, type, content_json, order", "Blok konten penyusun website"],
        ["assets", "id, user_id, file_url, mime_type, size", "Berkas yang diunggah (R2)"],
        ["ai_providers", "id, name, base_url, api_key_encrypted, is_enabled", "Daftar penyedia AI"],
        ["ai_permissions", "id, user_id/role, provider_id, daily_quota", "Izin akses user/role ke provider AI (many-to-many)"],
        ["ai_usage_logs", "id, user_id, provider_id, tokens, status, created_at", "Log setiap pemanggilan AI (bahan laporan)"],
    ],
    widths=[1.3, 2.8, 2.4],
)
para("Relasi utama: users 1—N sites, sites 1—N blocks, users N—N ai_providers (melalui ai_permissions), "
     "users 1—N ai_usage_logs.", italic=True)

# ---------- 8. Endpoint ----------
h1("8. Perancangan REST API (Endpoint Utama)")
table(
    ["Metode", "Endpoint", "Deskripsi", "Akses"],
    [
        ["POST", "/api/auth/register", "Registrasi akun baru", "Publik"],
        ["POST", "/api/auth/login", "Login, mengembalikan token", "Publik"],
        ["GET", "/api/users", "Daftar pengguna", "Admin"],
        ["PATCH", "/api/users/:id", "Aktifkan/nonaktifkan pengguna", "Admin"],
        ["GET/POST", "/api/providers", "Kelola penyedia AI", "Admin"],
        ["GET/POST", "/api/permissions", "Kelola izin & kuota AI", "Admin"],
        ["GET/POST", "/api/sites", "Daftar/buat website", "User"],
        ["GET/PUT/DELETE", "/api/sites/:id", "Detail/ubah/hapus website", "User (pemilik)"],
        ["GET", "/api/sites/:id/blocks", "Daftar blok website", "User (pemilik)"],
        ["POST", "/api/assets", "Upload gambar ke R2", "User"],
        ["POST", "/api/sites/:id/publish", "Publikasikan website", "User (pemilik)"],
        ["GET", "/api/ai/usage", "Riwayat pemakaian AI", "User / Admin"],
        ["POST", "/api/ai/:provider/chat", "Proxy permintaan AI via gateway", "User (sesuai izin)"],
        ["GET", "/api/reports/summary", "Ringkasan statistik + ekspor CSV", "Admin"],
    ],
    widths=[1.2, 2.0, 2.6, 1.2],
)

# ---------- 9. Tahapan ----------
h1("9. Rencana Tahapan Pengerjaan")
table(
    ["Tahap", "Kegiatan", "Hasil"],
    [
        ["1", "Setup proyek: Next.js, repositori GitHub, database Neon, storage R2, deploy awal ke Vercel", "Kerangka proyek live"],
        ["2", "Autentikasi (register/login/JWT) dan manajemen role", "Login berfungsi"],
        ["3", "CRUD website + blok konten dan editor sederhana", "User dapat membuat website"],
        ["4", "Upload aset ke R2 dan pratinjau website", "Website dapat dilihat"],
        ["5", "Publikasi website ke subdomain", "Website dapat diakses publik"],
        ["6", "AI Gateway: provider, permission, kuota, proxy, logging", "Asisten AI berfungsi terkontrol"],
        ["7", "Dashboard admin & laporan (statistik, ekspor CSV)", "Laporan tersedia"],
        ["8", "Pengujian, perbaikan bug, dokumentasi API, penulisan laporan", "Siap uji"],
    ],
    widths=[0.6, 4.0, 1.9],
)

# ---------- 10. Risiko ----------
h1("10. Analisis Kelebihan, Kekurangan, dan Mitigasi Risiko")
h2("Kelebihan")
bullets([
    "Menerapkan arsitektur API Gateway yang digunakan industri secara nyata.",
    "Keamanan kunci API terpusat di server (tidak terekspos ke klien).",
    "Kontrol akses multi-role dengan izin dan kuota yang dapat diubah secara real-time.",
    "REST API lengkap, basis data relasional bermakna, dan data log siap diolah menjadi laporan.",
    "Hemat biaya: seluruh infrastruktur menggunakan layanan free tier.",
])
h2("Kekurangan dan Mitigasi")
table(
    ["Kekurangan / Risiko", "Mitigasi"],
    [
        ["Bergantung pada free tier penyedia AI (batas kuota bisa berubah)", "Mekanisme fallback: bila kuota habis, tampilkan pesan ramah; admin dapat menonaktifkan provider"],
        ["Latensi bertambah karena permintaan melewati gateway", "Gateway dirancang ringan (hanya verifikasi dan forward)"],
        ["Dua tempat deploy (Vercel + BotKeep) menambah kompleksitas konfigurasi", "Dokumentasi konfigurasi environment variable secara rapi"],
        ["Gateway menjadi titik kegagalan tunggal bagi fitur AI", "Fitur builder tetap berjalan tanpa AI (AI bersifat pelengkap)"],
        ["Ruang penyimpanan dan RAM server terbatas (2 GB)", "Basis data dan berkas berada di layanan eksternal (Neon, R2)"],
    ],
    widths=[3.0, 3.5],
)

# ---------- 11. Penutup ----------
h1("11. Penutup")
para("Demikian proposal ide proyek WeBuild ini disusun. Besar harapan proyek ini dapat "
     "disetujui dan bimbingannya dapat berjalan sesuai tahapan yang direncanakan, sehingga "
     "menghasilkan produk perangkat lunak yang berfungsi penuh serta memenuhi kriteria "
     "Uji Kompetensi Keahlian Rekayasa Perangkat Lunak.")

doc.save("WeBuild_Proposal_IDE_UKK.docx")
print("saved")
