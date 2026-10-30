import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { SiteCard } from "@/components/dashboard/site-card";
import { TemplatePicker } from "@/components/dashboard/template-picker";
import { AiGenerateForm } from "@/components/dashboard/ai-generate-form";
import { redirect } from "next/navigation";

// F3: data asli dari Prisma (bukan mock). cookies() wajib dalam <Suspense> (Next 16 Cache Components).
// Layout: konten dashboard dipadatkan jadi 2 kolom ala IDE — panel builder AI (kiri)
// dan file explorer daftar site (kanan), di bawah tab bar dari layout 3-zona.

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
  const planName = user.plan?.name ?? "FREE";
  const canCreate = sites.length === 0 || planName !== "FREE";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
          Halo, {user.name}
        </h1>
        <span className="nb-badge nb-badge-yellow">{planName}</span>
      </header>

      {/* 2 kolom: builder AI (lebar) + explorer site (sempit) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Kolom kiri: AI-first builder */}
        <section className="flex flex-col gap-6">
          <p aria-hidden className="ide-cmt">
            ## ai.generate
          </p>
          <div
            className="nb-card flex flex-col gap-4"
            style={{ borderWidth: "3px", borderColor: "var(--accent)", background: "var(--surface2)" }}
          >
            <h2 className="text-xl font-bold sm:text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
              Bangun website baru dengan AI
            </h2>
            <AiGenerateForm canCreate={canCreate} />
          </div>

          {/* F11: Pilih template — grid kartu template siap pakai */}
          <p aria-hidden className="ide-cmt">
            ## templates
          </p>
          <section className="nb-card flex flex-col gap-4">
            <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              Atau mulai dari template
            </h2>
            <TemplatePicker canCreate={canCreate} />
          </section>
        </section>

        {/* Kolom kanan: explorer daftar site */}
        <section className="flex flex-col gap-3">
          <p aria-hidden className="ide-cmt">
            ## sites ({sites.length})
          </p>
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Website Saya
            <span className="ml-2 align-middle text-xs font-semibold" style={{ color: "var(--muted)" }}>
              {sites.length} file
            </span>
          </h2>
          {sites.length === 0 ? (
            <div className="nb-card m-0 flex flex-col items-center gap-3 p-8 text-center">
              <p className="font-semibold">Belum ada website</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Mulai dari prompt AI di samping, atau buat manual tanpa AI.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sites.map((s) => (
                <SiteCard key={s.id} site={s} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
