# ================================
# Stage 1: Builder
# ================================
FROM node:20-alpine AS builder

# Enable corepack để dùng pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY turbo.json ./

# Copy package.json của từng package (tận dụng Docker layer cache)
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json      ./packages/db/
COPY packages/ai/package.json      ./packages/ai/
COPY apps/api/package.json         ./apps/api/

# Cài dependencies
RUN pnpm install --frozen-lockfile

# Copy toàn bộ source
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Generate Prisma client
RUN pnpm --filter @fuviai/db exec prisma generate

# Build NestJS
RUN pnpm --filter @fuviai/api build

# Prune dev dependencies
RUN pnpm deploy --filter @fuviai/api --prod /prod/api

# ================================
# Stage 2: Runtime
# ================================
FROM node:20-alpine AS runtime

# Thêm dumb-init để signal handling đúng trong container
RUN apk add --no-cache dumb-init

# Non-root user vì lý do bảo mật
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nestjs

WORKDIR /app

# Copy production build + node_modules
COPY --from=builder --chown=nestjs:nodejs /prod/api/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist     ./dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/db/prisma ./prisma

# Prisma schema cần thiết cho runtime queries
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.pnpm/*/node_modules/@prisma \
     ./node_modules/@prisma 2>/dev/null || true

USER nestjs

EXPOSE 4000

ENV NODE_ENV=production

# dumb-init → node để xử lý signal (SIGTERM) đúng
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
