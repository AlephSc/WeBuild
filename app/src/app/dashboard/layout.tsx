import Link from "next/link";
import { Logo } from "@/components/nav";

const menu = [
  { href: "/dashboard", label: "Website Saya" },
  { href: "/dashboard/settings", label: "Pengaturan" }, // TODO: halaman F-lain
  { href: "/dashboard/upgrade", label: "Upgrade" }, // TODO: halaman billing
];

// Layout dashboard user: sidebar desktop → topbar mobile
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside
        className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink p-4 lg:w-64 lg:flex-col lg:items-stretch lg:justify-start lg:gap-6 lg:border-b-0 lg:border-r"
        style={{ background: "var(--surface)" }}
      >
        <Link href="/dashboard" aria-label="WeBuild — dashboard">
          <Logo />
        </Link>
        <nav className="flex gap-2 lg:flex-col" aria-label="Menu utama">
          {menu.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="nb-btn nb-btn-ghost text-sm lg:w-full"
            >
              {m.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 lg:mt-auto">
          {/* TODO F2: ambil user dari session (next-auth / better-auth) */}
          <span className="text-sm font-semibold">Budi</span>
          {/* TODO: wired logout — panggil signOut lalu redirect /login */}
          <button type="button" className="nb-btn nb-btn-ghost text-sm">
            Keluar
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
