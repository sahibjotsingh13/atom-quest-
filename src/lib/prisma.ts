// src/lib/prisma.ts
import { PrismaClient } from "../generated/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL!;

// For serverless environments (Vercel)
const createPrismaClient = () => {
  if (process.env.VERCEL) {
    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({ adapter });
  }
  
  // For local development
  return new PrismaClient();
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;