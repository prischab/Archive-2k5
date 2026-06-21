import { PrismaClient } from "@prisma/client";

// Reuse one Prisma client across hot-reloads in dev (avoids connection spam).
const globalForPrisma = globalThis;
export const prisma =
  globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
