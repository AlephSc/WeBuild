"use client";

// F5: komponen upload gambar via UploadThing — dipakai BlockForm image & gallery.
// Hasil upload → URL publik → onChange ke data blok.

import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export function ImageUpload({
  onUploaded,
  label = "Upload / Kamera (maks 2 MB)",
}: {
  onUploaded: (url: string) => void;
  label?: string;
}) {
  return (
    <UploadButton<OurFileRouter, "imageUploader">
      endpoint="imageUploader"
      appearance={{
        button: {
          background: "var(--surface2)",
          color: "var(--fg)",
          border: "2px solid var(--ink)",
          borderRadius: "10px",
          padding: "8px 14px",
          fontWeight: 600,
          fontSize: "13px",
          cursor: "pointer",
          boxShadow: "2px 2px 0 var(--shadow-hard)",
        },
        container: { display: "flex", flexDirection: "column", gap: "4px" },
      }}
      content={{ button: `📷 ${label}` }}
      onClientUploadComplete={(res) => {
        if (res?.[0]?.url) onUploaded(res[0].url);
      }}
      onUploadError={(err) => {
        alert(`Upload gagal: ${err.message}`);
      }}
    />
  );
}
