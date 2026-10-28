"use client";

// Wrapper fetch untuk semua mutasi /api/* — otomatis menyertakan header
// X-CSRF-Token dari cookie webuild_csrf (double-submit pattern).
// Cookie belum ada → ambil dulu dari GET /api/csrf (sekali, lalu cache).

export const CSRF_COOKIE = "webuild_csrf";
export const CSRF_HEADER = "X-CSRF-Token";

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

let fetching: Promise<string | null> | null = null;

async function ensureCsrfToken(): Promise<string | null> {
  const existing = readCookie(CSRF_COOKIE);
  if (existing) return existing;
  if (!fetching) {
    fetching = fetch("/api/csrf", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.token as string | undefined) ?? null)
      .catch(() => null)
      .finally(() => {
        // reset setelah microtask berikutnya supaya retry tetap mungkin
        setTimeout(() => (fetching = null), 0);
      });
  }
  const fresh = await fetching;
  return fresh ?? readCookie(CSRF_COOKIE);
}

export async function fetchWithCsrf(input: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const needsToken = !["GET", "HEAD", "OPTIONS"].includes(method);
  const headers = new Headers(init.headers);
  if (needsToken) {
    const token = await ensureCsrfToken();
    if (token) headers.set(CSRF_HEADER, token);
  }
  return fetch(input, { ...init, headers, credentials: "same-origin" });
}
