import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { SiteCard } from "@/components/dashboard/site-card";
import { TemplatePicker } from "@/components/dashboard/template-picker";
import { AiGenerateForm } from "@/components/dashboard/ai-generate-form";
import { redirect } from "next/navigation";

// F3: data asli dari Prisma (bukan mock). cookies() wajib dalam <Suspense> (Next 16 Cache Components).

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat dashboard…</div>}>
      <DashboardInner />
    </Suspense>
  );
}

async function DashboardInner() {
  const session = await getAuthUser();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    include: { plan: true, sites: { orderBy: { updatedAt: "desc" } } },
  });
  if (!user) redirect("/login");

  const sites = user.sites.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    status: s.publishedAt ? ("PUBLISHED" as const) : ("DRAFT" as const),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
          Halo, {user.name}
        </h1>
        <span className="nb-badge nb-badge-yellow">{user.plan?.name ?? "FREE"}</span>
      </header>

      {/* Kartu AI-first utama */}
      <section
        className="nb-card flex flex-col gap-4"
        style={{ borderWidth: "3px", borderColor: "var(--accent)", background: "var(--surface2)" }}
      >
        <h2 className="text-xl font-bold sm:text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
          Bangun website baru dengan AI
        </h2>
        <AiGenerateForm canCreate={sites.length === 0 || (user.plan?.name ?? "FREE") !== "FREE"} />
      </section>

      {/* F11: Pilih template — grid kartu template siap pakai */}
      <section className="nb-card flex flex-col gap-4">
        <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Atau mulai dari template
        </h2>
        <TemplatePicker canCreate={sites.length === 0 || (user.plan?.name ?? "FREE") !== "FREE"} />
      </section>

      {/* Daftar site */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Website Saya
        </h2>
        {sites.length === 0 ? (
          <div className="nb-card m-0 flex flex-col items-center gap-3 p-8 text-center">
            <p className="font-semibold">Belum ada website</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Mulai dari prompt AI di atas, atau buat manual tanpa AI.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((s) => (
              <SiteCard key={s.id} site={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
