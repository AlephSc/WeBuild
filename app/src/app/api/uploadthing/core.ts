import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/log";

// F5: UploadThing router — upload gambar untuk blok image/gallery.
// Validasi: hanya image, max 2MB (plan limit enforcement client + server),
// log ke tabel Asset untuk kuota & cleanup.

const f = createUploadthing();

const MAX_FILE_MB = 2;

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: `${MAX_FILE_MB}MB`, maxFileCount: 10 } })
    .middleware(async () => {
      const session = await getAuthUser();
      if (!session) throw new Error("Tidak terautentikasi");
      return { userId: session.uid };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // catat ke tabel assets (kuota & orphan cleanup F5+)
      try {
        await prisma.asset.create({
          data: {
            userId: metadata.userId,
            r2Key: file.key,
            url: file.url,
            contentType: file.type ?? "image/*",
            sizeBytes: file.size,
          },
        });
      } catch (e) {
        log("error", "asset record gagal", { err: String(e), key: file.key });
      }
      log("info", "upload complete", { userId: metadata.userId, key: file.key, size: file.size });
      return { url: file.url, key: file.key };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
