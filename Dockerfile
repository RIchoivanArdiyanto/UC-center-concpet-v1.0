# ============================================================================
#  UC Centers — Next.js 14 (standalone) + Prisma + PostgreSQL
#  Build: docker compose build     Jalan: docker compose up -d
# ============================================================================
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# ── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Schema Prisma ikut disalin SEBELUM npm ci: script postinstall menjalankan
# `prisma generate` (dibutuhkan Vercel yang meng-cache node_modules), dan
# perintah itu gagal bila schema-nya belum ada.
COPY prisma ./prisma
RUN npm ci

# ── Builder ─────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
# Seed ditulis dalam TypeScript. Runner tidak punya ts-node, jadi seed
# dikompilasi jadi CommonJS di sini supaya bisa dijalankan `node prisma/seed.js`.
RUN npx tsc prisma/seed.ts \
      --outDir /app/seed-dist \
      --module commonjs --target ES2020 \
      --esModuleInterop --skipLibCheck --resolveJsonModule

# ── Runner ──────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Output standalone Next.js (sudah termasuk node_modules hasil trace)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma: schema + migrations + CLI + engine, dipakai saat `migrate deploy`
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/seed-dist ./seed-dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma    ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma   ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs  ./node_modules/bcryptjs

COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Direktori unggahan dibuat lebih dulu dan dimiliki user non-root, kalau tidak
# Docker membuat mount point-nya sebagai root dan proses aplikasi gagal menulis.
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads
ENV UPLOAD_DIR=/app/uploads
VOLUME ["/app/uploads"]

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
