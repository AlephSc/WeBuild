import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { AdminPanel } from "@/components/admin/admin-panel";
import { Logo } from "@/components/nav";

// F10: Halaman Admin — config AI router + kelola user + moderasi + statistik
export default async function AdminPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat admin…</div>}>
      <AdminInner />
    </Suspense>
  );
}

async function AdminInner() {
  const session = await getAuthUser();
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-6xl p-4">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={28} />
          <span className="nb-badge nb-badge-coral">ADMIN</span>
        </div>
        <a href="/dashboard" className="nb-btn nb-btn-ghost text-sm">
          ← Dashboard
        </a>
      </header>
      <AdminPanel />
    </div>
  );
}
