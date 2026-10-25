import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/log";

// F1 Gate: health check mengecek DB, dipantau UptimeRobot.
export async function GET() {
  const started = Date.now();
  let db: "up" | "down" = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "up";
  } catch (e) {
    log("error", "health: db down", { err: String(e) });
  }
  const ok = db === "up";
  return NextResponse.json({ ok, db, durationMs: Date.now() - started }, { status: ok ? 200 : 503 });
}
