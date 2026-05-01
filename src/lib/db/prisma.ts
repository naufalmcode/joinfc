import { PrismaClient } from "@prisma/client";

/**
 * Returns current Jakarta time (UTC+7) as a Date object.
 * Used to store createdAt in WIB so the database column
 * directly shows Jakarta local time.
 */
export function jakartaNow(): Date {
  const str = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
  return new Date(str);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
