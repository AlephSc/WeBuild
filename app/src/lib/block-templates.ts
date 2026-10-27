import type { Block } from '@/lib/blocks';

let seq = 0;
const id = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`;

export type SiteTemplate = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  blocks: () => Block[];
};

// ===== Template 1: Kopi Kenangan Senja (seed asli, dipertahankan) =====
const kopiSenja: Block[] = [
  {
    id: 'tpl-kopi-hero',
    type: 'hero',
    data: {
      heading: 'Hangatnya Sore Ini',
      subheading: 'Kopi susu gula aren asli, dibuat dari biji robusta pilihan petani lokal Indonesia. Pesan sekarang — sampai rumah masih hangat.',
      ctaLabel: 'Pesan via WhatsApp',
      ctaUrl: 'https://wa.me/6281234567890',
    },
  },
  {
    id: 'tpl-kopi-text',
    type: 'text',
    data: {
      heading: 'Tentang Kami',
      body: 'Kopi Kenangan Senja adalah kedai kopi kecil yang percaya kopi terbaik datang dari petani lokal. Kami menyeduh setiap cangkir dengan hati.',
    },
  },
  {
    id: 'tpl-kopi-gallery',
    type: 'gallery',
    data: {
      images: [
        { url: 'https://picsum.photos/seed/kopi1/600/400', alt: 'Suasana kedai kopi sore hari' },
        { url: 'https://picsum.photos/seed/kopi2/600/400', alt: 'Kopi susu gula aren' },
        { url: 'https://picsum.photos/seed/kopi3/600/400', alt: 'Biji kopi robusta pilihan' },
      ],
    },
  },
  {
    id: 'tpl-kopi-btn',
    type: 'button',
    data: { label: 'Lihat Menu Lengkap', url: 'https://wa.me/6281234567890' },
  },
];

// ===== Template 2: Toko / UMKM =====
const tokoUmkm: Block[] = [
  {
    id: 'tpl-toko-hero',
    type: 'hero',
    data: {
      heading: 'Produk Terbaik, Harga Bersahabat',
      subheading: 'Koleksi terbaru selalu hadir. Pesan mudah lewat WhatsApp, kirim ke seluruh Indonesia.',
      ctaLabel: 'Belanja Sekarang',
      ctaUrl: 'https://wa.me/6281234567890',
    },
  },
  {
    id: 'tpl-toko-text',
    type: 'text',
    data: {
      heading: 'Kenapa Belanja di Sini?',
      body: 'Kami memilih produk dengan kualitas terbaik, dikemas aman, dan dikirim cepat. Garansi uang kembali jika barang tidak sesuai.',
    },
  },
  {
    id: 'tpl-toko-gallery',
    type: 'gallery',
    data: {
      images: [
        { url: 'https://picsum.photos/seed/produk1/600/400', alt: 'Foto produk unggulan 1' },
        { url: 'https://picsum.photos/seed/produk2/600/400', alt: 'Foto produk unggulan 2' },
        { url: 'https://picsum.photos/seed/produk3/600/400', alt: 'Foto produk unggulan 3' },
      ],
    },
  },
  {
    id: 'tpl-toko-contact',
    type: 'contact',
    data: { phone: '081234567890', message: 'Halo, saya tertarik dengan produk Anda!' },
  },
];

// ===== Template 3: Portofolio =====
const portofolio: Block[] = [
  {
    id: 'tpl-port-hero',
    type: 'hero',
    data: {
      heading: 'Halo, Saya Kreatif di Balik Layar',
      subheading: 'Desainer & developer yang membantu brand tampil beda. Terbuka untuk proyek freelance.',
      ctaLabel: 'Lihat Karya Saya',
      ctaUrl: '#karya',
    },
  },
  {
    id: 'tpl-port-text',
    type: 'text',
    data: {
      heading: 'Tentang Saya',
      body: 'Berpengalaman lebih dari 5 tahun menangani proyek desain grafis, identitas brand, dan pengembangan web. Fokus saya: desain yang jelas, cepat, dan berkesan.',
    },
  },
  {
    id: 'tpl-port-gallery',
    type: 'gallery',
    data: {
      images: [
        { url: 'https://picsum.photos/seed/karya1/600/400', alt: 'Proyek desain brand' },
        { url: 'https://picsum.photos/seed/karya2/600/400', alt: 'Mockup UI aplikasi' },
      ],
    },
  },
  {
    id: 'tpl-port-btn',
    type: 'button',
    data: { label: 'Hubungi Saya', url: 'https://wa.me/6281234567890' },
  },
];

// ===== Template 4: Event / Seminar =====
const eventSeminar: Block[] = [
  {
    id: 'tpl-evt-hero',
    type: 'hero',
    data: {
      heading: 'Seminar Nasional Teknologi 2026',
      subheading: 'Temui para ahli, perluas jaringan, dan pelajari tren teknologi terbaru dalam satu hari penuh.',
      ctaLabel: 'Daftar Sekarang',
      ctaUrl: 'https://forms.gle/',
    },
  },
  {
    id: 'tpl-evt-text',
    type: 'text',
    data: {
      heading: 'Agenda Acara',
      body: '08.00 — Registrasi & pembukaan.<br/>09.00 — Keynote: Masa Depan AI di Indonesia.<br/>10.30 — Workshop breakout: Web, Mobile, dan Data.<br/>13.00 — Networking lunch & showcase startup.',
    },
  },
  {
    id: 'tpl-evt-img',
    type: 'image',
    data: {
      url: 'https://picsum.photos/seed/seminar/800/400',
      alt: 'Suasana seminar teknologi tahun lalu',
      caption: 'Dokumentasi Seminar Teknologi 2025',
    },
  },
  {
    id: 'tpl-evt-btn',
    type: 'button',
    data: { label: 'Daftar via Google Form', url: 'https://forms.gle/' },
  },
];

// ===== Template 5: Sekolah / Kelas =====
const sekolah: Block[] = [
  {
    id: 'tpl-sch-hero',
    type: 'hero',
    data: {
      heading: 'Selamat Datang di Kelas Kami',
      subheading: 'Ruang berbagi karya, pengumuman, dan aktivitas belajar siswa RPL.',
      ctaLabel: 'Lihat Pengumuman',
      ctaUrl: '#pengumuman',
    },
  },
  {
    id: 'tpl-sch-text',
    type: 'text',
    data: {
      heading: 'Tentang Kelas',
      body: 'Kelas XII RPL fokus pada pengembangan perangkat lunak: web, mobile, dan IoT. Website ini menjadi wadah publikasi tugas, jadwal, dan karya siswa.',
    },
  },
  {
    id: 'tpl-sch-gallery',
    type: 'gallery',
    data: {
      images: [
        { url: 'https://picsum.photos/seed/sekolah1/600/400', alt: 'Kegiatan belajar di lab' },
        { url: 'https://picsum.photos/seed/sekolah2/600/400', alt: 'Proyek tim siswa' },
      ],
    },
  },
  {
    id: 'tpl-sch-contact',
    type: 'contact',
    data: { phone: '081234567890', message: 'Halo pak/bu, saya ingin bertanya tentang tugas.' },
  },
];

// ===== Template 6: Jasa / Freelancer =====
const jasaFreelance: Block[] = [
  {
    id: 'tpl-jasa-hero',
    type: 'hero',
    data: {
      heading: 'Jasa Pembuatan Website Cepat & Rapi',
      subheading: 'Landing page profesional selesai dalam 3 hari. Harga transparan, revisi gratis 2x.',
      ctaLabel: 'Konsultasi Gratis',
      ctaUrl: 'https://wa.me/6281234567890',
    },
  },
  {
    id: 'tpl-jasa-text',
    type: 'text',
    data: {
      heading: 'Layanan Kami',
      body: '<b>Landing Page</b> — satu halaman menjual.<br/><b>Company Profile</b> — profil bisnis lengkap.<br/><b>Toko Online</b> — katalog produk + order WhatsApp.',
    },
  },
  {
    id: 'tpl-jasa-btn',
    type: 'button',
    data: { label: 'Paket & Harga', url: 'https://wa.me/6281234567890' },
  },
  {
    id: 'tpl-jasa-contact',
    type: 'contact',
    data: { phone: '081234567890', message: 'Halo, saya mau konsultasi pembuatan website.' },
  },
];

// Katalog template F11 — tampil sebagai pilihan di dashboard.
export const SITE_TEMPLATES: SiteTemplate[] = [
  { id: 'kopi-senja', name: 'Kedai Kopi', emoji: '☕', description: 'Hangat, personal, cocok untuk UMKM makanan & minuman', blocks: () => kopiSenja },
  { id: 'toko-umkm', name: 'Toko Online', emoji: '🛍️', blocks: () => tokoUmkm, description: 'Katalog produk + pesan cepat WhatsApp' },
  { id: 'portofolio', name: 'Portofolio', emoji: '🎨', blocks: () => portofolio, description: 'Pamer karya & jasa profesional' },
  { id: 'event-seminar', name: 'Event / Seminar', emoji: '🎤', blocks: () => eventSeminar, description: 'Agenda, pembicara, dan pendaftaran' },
  { id: 'sekolah', name: 'Sekolah / Kelas', emoji: '🎓', blocks: () => sekolah, description: 'Pengumuman, karya siswa, profil kelas' },
  { id: 'jasa-freelance', name: 'Jasa / Freelancer', emoji: '💼', blocks: () => jasaFreelance, description: 'Daftar layanan & harga transparan' },
];

// SEED_TEMPLATE dipertahankan untuk kompatibilitas (id lama 'kopi-senja' tetap jadi default)
export const SEED_TEMPLATE: Block[] = kopiSenja;

export function getTemplate(id: string): SiteTemplate | undefined {
  return SITE_TEMPLATES.find((t) => t.id === id);
}

// TODO F8: ganti parser mock ini dengan structured output AI.
export function aiPromptToBlocks(instruction: string): Block[] {
  const text = instruction.trim();
  const firstSentence = text.split(/[.!?\n]/)[0]?.trim() || 'Website Baru Saya';
  const lower = text.toLowerCase();
  const isShop = /(toko|umkm|jual|dagang|produk|jualan)/.test(lower);
  const isPortfolio = /(portofolio|portfolio|jasa|freelance|desainer|developer|seniman)/.test(lower);

  if (isShop) {
    return [
      {
        id: id('ai-hero'),
        type: 'hero',
        data: {
          heading: firstSentence,
          subheading: 'Produk pilihan dengan harga terbaik. Lihat katalog dan pesan langsung lewat WhatsApp.',
          ctaLabel: 'Pesan Sekarang',
          ctaUrl: 'https://wa.me/6281234567890',
        },
      },
      {
        id: id('ai-gallery'),
        type: 'gallery',
        data: {
          images: [
            { url: 'https://picsum.photos/seed/produk1/600/400', alt: 'Foto produk 1' },
            { url: 'https://picsum.photos/seed/produk2/600/400', alt: 'Foto produk 2' },
            { url: 'https://picsum.photos/seed/produk3/600/400', alt: 'Foto produk 3' },
          ],
        },
      },
      {
        id: id('ai-contact'),
        type: 'contact',
        data: { phone: '081234567890', message: 'Butuh bantuan? Chat kami kapan saja.' },
      },
    ];
  }

  if (isPortfolio) {
    return [
      {
        id: id('ai-hero'),
        type: 'hero',
        data: {
          heading: firstSentence,
          subheading: 'Karya dan layanan terbaik, dikerjakan dengan penuh dedikasi.',
        },
      },
      {
        id: id('ai-text'),
        type: 'text',
        data: {
          heading: 'Tentang Saya',
          body: text || 'Perkenalkan diri dan layanan Anda di sini.',
        },
      },
      {
        id: id('ai-button'),
        type: 'button',
        data: { label: 'Hubungi Saya', url: 'https://wa.me/6281234567890' },
      },
    ];
  }

  return [
    {
      id: id('ai-hero'),
      type: 'hero',
      data: {
        heading: firstSentence,
        subheading: 'Selamat datang di website kami.',
        ctaLabel: 'Mulai',
        ctaUrl: '#kontak',
      },
    },
    {
      id: id('ai-text'),
      type: 'text',
      data: {
        heading: 'Tentang',
        body: text || 'Ceritakan tentang website Anda di sini.',
      },
    },
    {
      id: id('ai-button'),
      type: 'button',
      data: { label: 'Kontak Kami', url: 'https://wa.me/6281234567890' },
    },
  ];
}
