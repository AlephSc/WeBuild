import type { Block } from '@/lib/blocks';

// Template awal 'Kopi Kenangan Senja' — persis mockup (tab Site Hasil User).
export const SEED_TEMPLATE: Block[] = [
  {
    id: 'seed-hero',
    type: 'hero',
    data: {
      heading: 'Hangatnya Sore Ini',
      subheading: 'Kopi susu gula aren asli, dibuat dari biji robusta pilihan petani lokal Indonesia. Pesan sekarang — sampai rumah masih hangat.',
      ctaLabel: 'Pesan via WhatsApp',
      ctaUrl: 'https://wa.me/6281234567890',
    },
  },
  {
    id: 'seed-text',
    type: 'text',
    data: {
      heading: 'Tentang Kami',
      body: 'Kopi Kenangan Senja adalah kedai kopi kecil yang percaya kopi terbaik datang dari petani lokal. Kami menyeduh setiap cangkir dengan hati.',
    },
  },
  {
    id: 'seed-button',
    type: 'button',
    data: {
      label: 'Lihat Menu Lengkap',
      url: 'https://wa.me/6281234567890',
    },
  },
];

let seq = 0;
const id = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`;

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
