import Link from "next/link";

// Logo wordmark WeBuild (F11 polish nanti — ini versi dasar konsisten)
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5" style={{ fontFamily: "var(--font-heading)" }}>
      <span
        aria-hidden
        style={{
          width: size,
          height: size,
          background: "var(--accent)",
          border: "2px solid var(--ink)",
          borderRadius: 8,
          display: "grid",
          placeItems: "center",
          color: "var(--ink)",
          boxShadow: "2px 2px 0 var(--shadow-hard)",
          fontSize: size * 0.55,
          fontWeight: 700,
        }}
      >
        W
      </span>
      <span style={{ fontWeight: 700, fontSize: size * 0.7 }}>WeBuild</span>
    </span>
  );
}

// Navbar publik (landing/login/register)
export function PublicNav() {
  return (
    <nav className="flex items-center justify-between py-2">
      <Link href="/" aria-label="WeBuild — beranda">
        <Logo />
      </Link>
      <div className="flex gap-2.5">
        <Link href="/login" className="nb-btn nb-btn-ghost">
          Masuk
        </Link>
        <Link href="/register" className="nb-btn nb-btn-primary">
          Daftar Gratis
        </Link>
      </div>
    </nav>
  );
}
