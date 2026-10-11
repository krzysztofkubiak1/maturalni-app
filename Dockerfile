# Obraz produkcyjny frontu (Next.js 16, App Router).
#
# To NIE jest statyczny SPA — strona ma middleware (src/proxy.ts), strony
# renderowane po stronie serwera na podstawie ciasteczka sesji (/panel,
# /panel/admin, /kursy/[slug]/zapisz-sie, /logowanie, /rejestracja) oraz
# Server Actions (src/app/actions.ts). Dlatego końcowy obraz uruchamia
# prawdziwy serwer Node (tryb "standalone" z next.config.ts), a nie Caddy
# serwujący pliki statyczne — Caddy tylko proxuje do tego kontenera.

# ---- budowanie ----
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- runtime ----
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# "standalone" (next.config.ts) spakował tylko to, co trzeba do uruchomienia —
# własny server.js + minimalny node_modules. public/ i .next/static trzeba
# dołożyć ręcznie (tak działa ten tryb w Next.js).
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD node -e "fetch('http://localhost:3000/').then(r=>{if(!r.ok)throw 1}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
