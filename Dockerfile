# ---- builder stage ----
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.6.0 --activate

# Copy workspace manifests and lockfile first (better layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/sun/package.json ./apps/sun/package.json

RUN pnpm install --frozen-lockfile

# Copy the rest of the source
COPY . .

# prebuild (copy-cesium.js) runs automatically via pnpm lifecycle before build
RUN pnpm --filter sun run build

# ---- runner stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# next build output: standalone emits a self-contained server
COPY --from=builder /app/apps/sun/.next/standalone ./
# Static assets and public dir must sit alongside the standalone server
COPY --from=builder /app/apps/sun/.next/static ./apps/sun/.next/static
COPY --from=builder /app/apps/sun/public       ./apps/sun/public

EXPOSE 3000

CMD ["node", "apps/sun/server.js"]
