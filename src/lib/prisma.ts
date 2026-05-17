// src/lib/prisma.ts
import { PrismaClient } from "../generated/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use standard PrismaClient for both Vercel Serverless and local dev.
// Neon's pooled connection string (pgbouncer=true) handles serverless connections natively and flawlessly.
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;