import type { Metadata } from "next";
import { PublicNav } from "@/components/nav";
import { GoogleAuthCard } from "@/components/google-auth-card";

export const metadata: Metadata = { title: "Daftar — WeBuild" };

export default function RegisterPage() {
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--bg)" }}>
      <PublicNav />
      <main className="flex-1 grid place-items-center px-4 py-10">
        <div className="w-full" style={{ maxWidth: 440 }}>
          <div className="nb-card">
            <h1 className="text-2xl mb-1">Daftar</h1>
            <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>
              Cukup satu klik dengan akun Google — tanpa password.
            </p>
            <GoogleAuthCard mode="register" />
          </div>
        </div>
      </main>
    </div>
  );
}
