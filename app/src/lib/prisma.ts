// Prisma client singleton — DATABASE_URL dari .env (Neon) dipakai otomatis.
// Tanpa DATABASE_URL, koneksi gagal dan /api/health melaporkan db:down.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
