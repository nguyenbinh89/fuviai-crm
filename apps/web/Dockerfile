# ================================
# Stage 1: Dependencies
# ================================
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY turbo.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json      ./packages/db/
COPY packages/ui/package.json      ./packages/ui/
COPY apps/web/package.json         ./apps/web/

RUN pnpm install --frozen-lockfile

# ================================
# Stage 2: Builder
# ================================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY --from=deps /app/node_modules       ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

COPY . .

# Generate Prisma client
RUN pnpm --filter @fuviai/db exec prisma generate

# Build Next.js với standalone output
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @fuviai/web build

# ================================
# Stage 3: Runtime
# ================================
FROM node:20-alpine AS runtime

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nextjs

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Next.js standalone output tự bundle node_modules cần thiết
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static     ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public           ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/web/server.js"]
