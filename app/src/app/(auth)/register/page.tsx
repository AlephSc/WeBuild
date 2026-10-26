import type { Metadata } from "next";
import { PublicNav } from "@/components/nav";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Daftar Gratis — WeBuild" };

export default function RegisterPage() {
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--bg)" }}>
      <PublicNav />
      <main className="flex-1 grid place-items-center px-4 py-10">
        <div className="w-full" style={{ maxWidth: 440 }}>
          <div className="nb-card">
            <h1 className="text-2xl mb-1">Daftar Gratis</h1>
            <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>
              Buat akun dan mulai dari paket FREE. Tanpa kartu kredit.
            </p>
            <AuthForm mode="register" />
          </div>
        </div>
      </main>
    </div>
  );
}
