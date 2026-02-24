# ---- deps stage ----
# Install dependencies only (cached separately from source)
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable

# Copy workspace manifests and lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/sun/package.json ./apps/sun/package.json

RUN pnpm install --frozen-lockfile

# ---- builder stage ----
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/sun/node_modules ./apps/sun/node_modules
COPY . .

# prebuild script (copy-cesium.js) runs automatically via pnpm lifecycle
RUN pnpm --filter sun run build

# ---- runner stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# next build --output=standalone emits a self-contained server
COPY --from=builder /app/apps/sun/.next/standalone ./
# Static assets and public dir must be copied alongside the standalone server
COPY --from=builder /app/apps/sun/.next/static ./apps/sun/.next/static
COPY --from=builder /app/apps/sun/public ./apps/sun/public

EXPOSE 3000

CMD ["node", "apps/sun/server.js"]
