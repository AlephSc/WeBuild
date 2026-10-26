"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Form "Buat manual tanpa AI" — POST /api/sites lalu ke editor (F3)
export function NewSiteForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || "Website Baru" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat website.");
        return;
      }
      router.push(`/editor/${data.site.id}`);
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="underline" style={{ color: "var(--muted)" }}>
        Buat manual tanpa AI
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <div className="nb-field mb-0 w-56">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nama website, mis. Toko Kopi Senja"
          aria-label="Nama website"
          maxLength={80}
        />
      </div>
      <button type="submit" className="nb-btn nb-btn-primary text-sm" disabled={loading}>
        {loading ? "Membuat…" : "Buat"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="nb-btn nb-btn-ghost text-sm">
        Batal
      </button>
      {error && (
        <span className="text-xs" style={{ color: "var(--accent-danger)" }} role="alert">
          {error}
        </span>
      )}
    </form>
  );
}
