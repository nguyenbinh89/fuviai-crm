import { PrismaClient } from '@prisma/client';

// Singleton PrismaClient — tránh tạo nhiều connection trong development (hot-reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-export Prisma types cần dùng ở nhiều nơi
export { Prisma, Plan, UserRole, UserStatus } from '@prisma/client';
export type {
  Organization,
  User,
  RefreshToken,
} from '@prisma/client';
