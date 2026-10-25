// Placeholder DB untuk development lokal F1 (belum ada Neon).
// Saat DATABASE_URL diset, Prisma pakai Neon; health check melaporkan status asli.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: process.env.DATABASE_URL ? undefined : { db: { url: "postgresql://placeholder:placeholder@localhost:5432/placeholder" } },
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
