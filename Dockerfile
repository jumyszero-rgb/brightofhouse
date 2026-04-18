# @/Dockerfile
# 1. ビルド環境 (Builder)
FROM node:20 AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y openssl

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate

ARG NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID

# 本番用に最適化されたビルドを実行
RUN npm run build

# 2. 実行環境 (Runner)
FROM node:20 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

RUN apt-get update && apt-get install -y ffmpeg openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# 開発モード(dev)ではなく、本番モードで起動
CMD ["node", "server.js"]