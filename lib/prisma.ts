import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  try {
    if (!process.env.DATABASE_URL) {
      // No database configured - return a client that will fail gracefully
      return new PrismaClient({
        adapter: new PrismaPg({ connectionString: "postgresql://localhost/placeholder" }),
        log: ["error"],
      })
    }
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    })
  } catch {
    return new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL || "postgresql://localhost/placeholder" }),
      log: ["error"],
    })
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
