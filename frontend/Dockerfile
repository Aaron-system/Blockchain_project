# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Bake production API URLs in at build time (passed via docker-compose build args)
ARG NEXT_PUBLIC_NODE_URL=https://blockchain-node.aaronk.tech
ARG NEXT_PUBLIC_CLIENT_URL=https://blockchain-wallet.aaronk.tech
ENV NEXT_PUBLIC_NODE_URL=$NEXT_PUBLIC_NODE_URL
ENV NEXT_PUBLIC_CLIENT_URL=$NEXT_PUBLIC_CLIENT_URL

RUN npm run build

# ── Stage 2: production runner (standalone output) ─────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
