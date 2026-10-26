import { z } from 'zod';

export type BlockType = 'hero' | 'text' | 'image' | 'button' | 'gallery' | 'contact';

export const HeroSchema = z.object({
  heading: z.string().min(1),
  subheading: z.string().default(''),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  alt: z.string().optional(),
});

export const TextSchema = z.object({
  heading: z.string().optional(),
  body: z.string().min(1),
});

export const ImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().min(1), // WAJIB — a11y PRD F6
  caption: z.string().optional(),
});

export const ButtonSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const GalleryImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().min(1),
});

export const GallerySchema = z.object({
  images: z.array(GalleryImageSchema).min(1),
});

export const ContactSchema = z.object({
  phone: z.string().min(1),
  message: z.string().optional(),
});

export type Block = {
  id: string;
  type: BlockType;
  data: HeroData | TextData | ImageData | ButtonData | GalleryData | ContactData;
};

export type HeroData = z.infer<typeof HeroSchema>;
export type TextData = z.infer<typeof TextSchema>;
export type ImageData = z.infer<typeof ImageSchema>;
export type ButtonData = z.infer<typeof ButtonSchema>;
export type GalleryData = z.infer<typeof GallerySchema>;
export type ContactData = z.infer<typeof ContactSchema>;

export const blockSchemas: Record<BlockType, z.ZodTypeAny> = {
  hero: HeroSchema,
  text: TextSchema,
  image: ImageSchema,
  button: ButtonSchema,
  gallery: GallerySchema,
  contact: ContactSchema,
};

export const BLOCK_TYPES: { type: BlockType; labelIndonesia: string }[] = [
  { type: 'hero', labelIndonesia: 'Hero' },
  { type: 'text', labelIndonesia: 'Teks' },
  { type: 'image', labelIndonesia: 'Gambar' },
  { type: 'button', labelIndonesia: 'Tombol' },
  { type: 'gallery', labelIndonesia: 'Galeri' },
  { type: 'contact', labelIndonesia: 'Kontak/WA' },
];

export function validateBlock(block: unknown) {
  const parsed = block as { type?: BlockType } | null;
  if (!parsed || typeof parsed !== 'object' || !parsed.type || !blockSchemas[parsed.type]) {
    return { success: false as const, error: 'Tipe block tidak dikenal' };
  }
  const data = (block as { data?: unknown }).data;
  const result = blockSchemas[parsed.type].safeParse(data);
  return result;
}
