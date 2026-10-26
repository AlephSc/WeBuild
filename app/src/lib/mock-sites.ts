// TODO F3: ganti mock ini dengan query Prisma (Site.findMany milik user)
export type SiteStatus = "PUBLISHED" | "DRAFT";

export interface MockSite {
  id: string;
  title: string;
  slug: string;
  status: SiteStatus;
  updatedAt: string; // ISO string — mudah diserialisasi
}

export const mockSites: MockSite[] = [
  {
    id: "site-1",
    title: "Kopi Kenangan Senja",
    slug: "kopi-kenangan-senja",
    status: "PUBLISHED",
    updatedAt: "2026-10-20T10:00:00.000Z",
  },
  {
    id: "site-2",
    title: "Konveksi Alef",
    slug: "konveksi-alef",
    status: "DRAFT",
    updatedAt: "2026-10-18T09:00:00.000Z",
  },
  {
    id: "site-3",
    title: "Portofolio Saya",
    slug: "portofolio-saya",
    status: "DRAFT",
    updatedAt: "2026-10-15T08:00:00.000Z",
  },
];
