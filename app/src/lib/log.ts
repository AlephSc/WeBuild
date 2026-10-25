// JSON structured logger — satu helper untuk semua route kritis.
// Dipakai di Vercel Logs & dikirim ke Sentry (F1+). Konteks: userId, slug, durationMs.
export type LogLevel = "info" | "warn" | "error";

export function log(level: LogLevel, msg: string, ctx: Record<string, unknown> = {}) {
  const entry = { ts: new Date().toISOString(), level, msg, ...ctx };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
