"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";

type Mode = "login" | "register";

const loginSchema = z.object({
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(60, "Nama maksimal 60 karakter"),
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  tos: z.literal(true, { message: "Anda harus menyetujui Syarat & Privasi" }),
});

const ERR_COLOR = "var(--accent-danger)";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", email: "", password: "", tos: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const isReg = mode === "register";

  function set<K extends keyof typeof values>(key: K, val: (typeof values)[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = (isReg ? registerSchema : loginSchema).safeParse(
      isReg ? values : { email: values.email, password: values.password },
    );
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "_form");
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.errors ?? { _form: "Terjadi kesalahan, coba lagi" });
        return;
      }
      router.push("/dashboard"); // F3 — placeholder sementara
      router.refresh();
    } catch {
      setErrors({ _form: "Tidak dapat terhubung ke server" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {errors._form && (
        <p className="text-sm font-semibold" style={{ color: ERR_COLOR }} role="alert">
          {errors._form}
        </p>
      )}

      {isReg && (
        <div className="nb-field">
          <label htmlFor="name">Nama</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
          />
          {errors.name && (
            <p className="mt-1 text-sm" style={{ color: ERR_COLOR }}>
              {errors.name}
            </p>
          )}
        </div>
      )}

      <div className="nb-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
        />
        {errors.email && (
          <p className="mt-1 text-sm" style={{ color: ERR_COLOR }}>
            {errors.email}
          </p>
        )}
      </div>

      <div className="nb-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete={isReg ? "new-password" : "current-password"}
          value={values.password}
          onChange={(e) => set("password", e.target.value)}
        />
        {errors.password && (
          <p className="mt-1 text-sm" style={{ color: ERR_COLOR }}>
            {errors.password}
          </p>
        )}
      </div>

      {isReg && (
        <div>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={values.tos}
              onChange={(e) => set("tos", e.target.checked)}
              className="mt-1 size-4 shrink-0"
              style={{ width: 16, height: 16, accentColor: "var(--accent)" }}
            />
            <span className="text-sm" style={{ color: errors.tos ? ERR_COLOR : "var(--fg)" }}>
              Saya setuju{" "}
              <Link href="/tos" className="underline font-semibold">
                Syarat &amp; Privasi
              </Link>
            </span>
          </label>
          {errors.tos && (
            <p className="mt-1 text-sm" style={{ color: ERR_COLOR }}>
              {errors.tos}
            </p>
          )}
        </div>
      )}

      <button type="submit" className="nb-btn nb-btn-primary w-full" disabled={busy}>
        {busy ? "Memproses…" : isReg ? "Daftar Gratis" : "Masuk"}
      </button>

      <p className="text-sm text-center" style={{ color: "var(--muted)" }}>
        {isReg ? "Sudah punya akun? " : "Belum punya akun? "}
        <Link href={isReg ? "/login" : "/register"} className="underline font-semibold" style={{ color: "var(--fg)" }}>
          {isReg ? "Masuk" : "Daftar Gratis"}
        </Link>
      </p>
    </form>
  );
}
