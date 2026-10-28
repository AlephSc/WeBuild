"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchWithCsrf } from "@/lib/fetch-with-csrf";

// Tombol logout di activity bar — POST /api/auth/logout (CSRF-protected)
// lalu hard-navigate ke /login agar session server ikut segar.
export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetchWithCsrf("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="ide-act danger"
      aria-label="Keluar"
      title="Keluar"
      style={{ width: 40, height: 40, fontSize: 16 }}
    >
      {loading ? "…" : "⏻"}
    </button>
  );
}
