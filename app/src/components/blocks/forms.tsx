import type { BlockType, HeroData, TextData, ImageData, ButtonData, GalleryData, ContactData } from '@/lib/blocks';
import { ImageUpload } from './image-upload';

type Props = {
  type: BlockType;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
};

function Field({
  label,
  value,
  onChange,
  textarea,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  required?: boolean;
}) {
  return (
    <div className="nb-field">
      <label>
        {label}
        {required ? ' (wajib)' : ''}
      </label>
      {textarea ? (
        <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

export default function BlockForm({ type, data, onChange }: Props) {
  const set = (key: string) => (v: string) => onChange({ ...data, [key]: v });
  const s = (k: string) => (typeof data[k] === 'string' ? (data[k] as string) : '');

  switch (type) {
    case 'hero': {
      const d = data as unknown as HeroData;
      return (
        <>
          <Field label="Judul Utama" value={d.heading ?? ''} onChange={set('heading')} required />
          <Field label="Subjudul" value={d.subheading ?? ''} onChange={set('subheading')} />
          <Field label="Teks Tombol CTA" value={d.ctaLabel ?? ''} onChange={set('ctaLabel')} />
          <Field label="URL CTA" value={d.ctaUrl ?? ''} onChange={set('ctaUrl')} />
          <Field label="URL Gambar" value={d.imageUrl ?? ''} onChange={set('imageUrl')} />
          <Field label="Teks Alternatif Gambar" value={d.alt ?? ''} onChange={set('alt')} />
        </>
      );
    }
    case 'text': {
      const d = data as unknown as TextData;
      return (
        <>
          <Field label="Judul Bagian" value={d.heading ?? ''} onChange={set('heading')} />
          <Field label="Isi Teks" value={d.body} onChange={set('body')} textarea required />
        </>
      );
    }
    case 'image': {
      const d = data as unknown as ImageData;
      return (
        <>
          <div className="nb-field">
            <label>Upload Gambar (maks 2 MB)</label>
            <ImageUpload onUploaded={(url) => onChange({ ...data, url })} />
          </div>
          <Field label="URL Gambar" value={d.url ?? ''} onChange={set('url')} required />
          <Field label="Teks Alternatif (alt)" value={d.alt ?? ''} onChange={set('alt')} required />
          <Field label="Keterangan (caption)" value={d.caption ?? ''} onChange={set('caption')} />
        </>
      );
    }
    case 'button': {
      const d = data as unknown as ButtonData;
      return (
        <>
          <Field label="Teks Tombol" value={d.label ?? ''} onChange={set('label')} required />
          <Field label="URL Tujuan" value={d.url ?? ''} onChange={set('url')} required />
        </>
      );
    }
    case 'gallery': {
      const d = data as unknown as GalleryData;
      const images = d.images ?? [];
      const update = (i: number, key: 'url' | 'alt', v: string) => {
        const next = images.map((img, j) => (j === i ? { ...img, [key]: v } : img));
        onChange({ ...data, images: next });
      };
      return (
        <>
          <div className="nb-field" style={{ marginBottom: '0.75rem' }}>
            <label>Upload ke Galeri (maks 2 MB / file)</label>
            <ImageUpload
              onUploaded={(url) =>
                onChange({ ...data, images: [...images, { url, alt: '' }] })
              }
            />
          </div>
          {images.map((img, i) => (
            <div key={i} style={{ border: '1px dashed #1c3d52', padding: '0.75rem', marginBottom: '0.75rem' }}>
              <div className="nb-field" style={{ marginBottom: '0.5rem' }}>
                <label>Gambar {i + 1} — URL</label>
                <input value={img.url ?? ''} onChange={(e) => update(i, 'url', e.target.value)} />
              </div>
              <div className="nb-field">
                <label>Gambar {i + 1} — Teks Alternatif (alt) (wajib)</label>
                <input value={img.alt ?? ''} onChange={(e) => update(i, 'alt', e.target.value)} />
              </div>
            </div>
          ))}
          <button
            type="button"
            className="nb-btn nb-btn-ghost"
            onClick={() => onChange({ ...data, images: [...images, { url: '', alt: '' }] })}
          >
            + Tambah Gambar
          </button>
        </>
      );
    }
    case 'contact': {
      const d = data as unknown as ContactData;
      return (
        <>
          <Field label="Nomor WhatsApp" value={d.phone ?? ''} onChange={set('phone')} required />
          <Field label="Pesan Singkat" value={d.message ?? ''} onChange={set('message')} />
        </>
      );
    }
    default:
      return null;
  }
}
