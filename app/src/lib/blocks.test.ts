import { describe, it, expect } from 'vitest';
import { validateBlock, type Block } from './blocks';
import { aiPromptToBlocks, SEED_TEMPLATE } from './block-templates';

describe('schema validasi', () => {
  it('hero valid', () => {
    const b: Block = { id: 'x', type: 'hero', data: { heading: 'Hallo', subheading: '' } };
    expect(validateBlock(b).success).toBe(true);
  });

  it('hero invalid — heading kosong', () => {
    const b: Block = { id: 'x', type: 'hero', data: { heading: '', subheading: '' } };
    expect(validateBlock(b).success).toBe(false);
  });

  it('image valid', () => {
    const b: Block = { id: 'x', type: 'image', data: { url: 'https://a.com/i.png', alt: 'Foto kopi' } };
    expect(validateBlock(b).success).toBe(true);
  });

  it('image invalid — alt kosong (a11y PRD F6)', () => {
    const b: Block = { id: 'x', type: 'image', data: { url: 'https://a.com/i.png', alt: '' } };
    expect(validateBlock(b).success).toBe(false);
  });

  it('image invalid — url bukan url', () => {
    const b: Block = { id: 'x', type: 'image', data: { url: 'bukan-url', alt: 'Foto' } };
    expect(validateBlock(b).success).toBe(false);
  });

  it('button valid', () => {
    const b: Block = { id: 'x', type: 'button', data: { label: 'Pesan', url: 'https://wa.me/6281' } };
    expect(validateBlock(b).success).toBe(true);
  });

  it('gallery invalid — images kosong', () => {
    const b: Block = { id: 'x', type: 'gallery', data: { images: [] } };
    expect(validateBlock(b).success).toBe(false);
  });

  it('gallery valid', () => {
    const b: Block = {
      id: 'x',
      type: 'gallery',
      data: { images: [{ url: 'https://a.com/1.png', alt: 'Produk 1' }] },
    };
    expect(validateBlock(b).success).toBe(true);
  });

  it('contact valid', () => {
    const b: Block = { id: 'x', type: 'contact', data: { phone: '08123456789' } };
    expect(validateBlock(b).success).toBe(true);
  });

  it('tipe tidak dikenal gagal', () => {
    expect(validateBlock({ id: 'x', type: 'bogus', data: {} }).success).toBe(false);
  });
});

describe('aiPromptToBlocks', () => {
  const prompts = [
    'Bikin toko jual kopi susu gula aren yang enak.',
    'Website portofolio desainer grafis bernama Rian.',
    'Website untuk komunitas pecinta tanaman.',
  ];

  it.each(prompts)('hasil lolos validateBlock semua: %s', (p) => {
    for (const b of aiPromptToBlocks(p)) expect(validateBlock(b).success).toBe(true);
  });

  it('SEED_TEMPLATE lolos validasi', () => {
    for (const b of SEED_TEMPLATE) expect(validateBlock(b).success).toBe(true);
  });
});
