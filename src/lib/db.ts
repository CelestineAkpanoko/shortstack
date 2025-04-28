import { PrismaClient } from "@prisma/client";

// Create a completely new instance with strict logging configuration
const prismaClientSingleton = () => {
  // Disable all Prisma logs completely
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? [] : [],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const db = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;