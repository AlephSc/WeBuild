import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { BottomPanel, StatusBar, IdeChromeClient } from "@/components/dashboard/ide-chrome";

const navItems = [
  { href: "/dashboard", label: "Website Saya", act: "home", glyph: "W" },
  { href: "/dashboard/settings", label: "Pengaturan", act: "settings", glyph: "S" }, // TODO: halaman F-lain
  { href: "/dashboard/upgrade", label: "Upgrade", act: "upgrade", glyph: "U" }, // TODO: halaman billing
];

// Layout dashboard user: 3 zona ala IDE
//   Zona 1 (kiri)  : activity bar vertikal — navigasi + logout
//   Zona 2 (tengah): tab bar ala editor + konten (children)
//   Zona 3 (kanan) : inspektor akun & paket (desktop) / panel atas (mobile)
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthUser();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.uid },
        include: { plan: true },
      })
    : null;
  const userName = user?.name ?? "Kamu";
  const planName = user?.plan?.name ?? "FREE";
  const siteCount = user ? await prisma.site.count({ where: { ownerId: user.id } }) : 0;
  const planLimit = planName === "FREE" ? 1 : 10; // sinkron dgn batas AI-form: FREE 1 site, PLUS 10

  return (
    <IdeChromeFrame
      userName={userName}
      planName={planName}
      siteCount={siteCount}
      planLimit={planLimit}
    >
      {/* ===== Zona 1: activity bar ===== */}
      <aside className="ide-activitybar" aria-label="Navigasi dashboard">
        <Link href="/" aria-label="WeBuild — beranda" className="text-xl" style={{ fontFamily: "var(--font-heading)", color: "var(--fg)", fontWeight: 700 }}>
          W
        </Link>
        <span aria-hidden className="nb-dashed" style={{ margin: 0, width: 32, borderTopWidth: 2 }} />
        <nav className="flex flex-col gap-3" aria-label="Menu utama">
          {navItems.map((m) => (
            <Link key={m.href} href={m.href} className="ide-act" aria-label={m.label} title={m.label}>
              {m.glyph}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <LogoutButton />
        </div>
      </aside>

      {/* ===== Zona 2: tab bar + konten ===== */}
      <div className="ide-main">
        <div className="ide-tabs">
          <Link href="/dashboard" className="ide-tab active">
            Dashboard
          </Link>
          <a
            href="https://webuild.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="ide-tab"
          >
            Site Live
          </a>
          <span
            aria-hidden
            className="ml-3 hidden self-center text-xs md:inline"
            style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
          >
            workspace / {userName.toLowerCase().replace(/\s+/g, "-")}
          </span>
        </div>
        <div className="ide-scroll">{children}</div>
      </div>

      {/* ===== Zona 3: inspektor ===== */}
      <aside className="ide-inspector" aria-label="Info akun">
        <h2 className="text-sm font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          INSPECTOR
        </h2>
        <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
          {userName}
        </p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {planName === "FREE" ? "Paket gratis" : "Paket PLUS"}
        </p>

        <div className="nb-card m-0 flex flex-col gap-2 p-4" style={{ borderWidth: 2 }}>
          <p className="text-xs font-semibold uppercase" style={{ letterSpacing: "0.5px", color: "var(--muted)" }}>
            Kuota website
          </p>
          {/* Angka nyata dari DB — bukan placeholder (R-17) */}
          <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {siteCount}/{planLimit}
          </p>
          <div
            aria-hidden
            className="h-2 w-full rounded"
            style={{ background: "var(--ink)", border: "2px solid var(--ink)" }}
          >
            <div
              style={{
                width: `${Math.min(100, (siteCount / planLimit) * 100)}%`,
                height: "100%",
                background: siteCount >= planLimit ? "var(--accent-danger)" : "var(--accent-success)",
                borderRadius: 4,
              }}
            />
          </div>
          {siteCount >= planLimit ? (
            <p className="text-xs" style={{ color: "var(--accent-danger)" }}>
              Kuota habis — hapus atau upgrade ke PLUS.
            </p>
          ) : (
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Sisa {planLimit - siteCount} slot website.
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Link href="/dashboard/upgrade" className="nb-btn nb-btn-mint w-full text-sm">
            Upgrade
          </Link>
        </div>
      </aside>
    </IdeChromeFrame>
  );
}

// Client wrapper: statusbar + bottom panel butuh state/fetch browser.
function IdeChromeFrame({
  userName,
  planName,
  siteCount,
  planLimit,
  children,
}: {
  userName: string;
  planName: string;
  siteCount: number;
  planLimit: number;
  children: React.ReactNode;
}) {
  const masalah: string[] = [];
  if (siteCount >= planLimit) masalah.push(`Kuota website penuh (${siteCount}/${planLimit}) — upgrade ke PLUS atau hapus site.`);
  return (
    <IdeChromeClient
      planName={planName}
      siteCount={siteCount}
      planLimit={planLimit}
      masalah={masalah}
    >
      {children}
    </IdeChromeClient>
  );
}
