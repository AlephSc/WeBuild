"use client";

// F9: tombol Laporkan — client component kecil (fetch POST).
// Harus file terpisah: didefinisikan di page.tsx (Server Component) membuat
// onClick ilegal untuk dilempar ke client (error "Event handlers cannot be
// passed to Client Component props" saat runtime).
import { useState } from "react";
import { fetchWithCsrf } from "@/lib/fetch-with-csrf";

export function ReportButton({ slug }: { slug: string }) {
  const [label, setLabel] = useState("⚠ Laporkan");
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      disabled={done}
      style={{
        border: "2px solid #061421", background: "#fff", borderRadius: 8,
        padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: done ? "default" : "pointer",
        boxShadow: "2px 2px 0 #061421",
      }}
      onClick={async () => {
        setLabel("Mengirim…");
        try {
          const res = await fetchWithCsrf("/api/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
          });
          const data = await res.json();
          setLabel(data.ok ? "✔ Terkirim" : (data.error ?? "Gagal"));
        } catch {
          setLabel("Gagal kirim");
        } finally {
          setDone(true);
        }
      }}
    >
      {label}
    </button>
  );
}
