# @/Dockerfile
# 1. ビルド環境 (Builder)
FROM node:20 AS builder
WORKDIR /app

# ビルドに必要なツールをインストール
RUN apt-get update && apt-get install -y openssl

# 依存関係のインストール
COPY package*.json ./
RUN npm ci

# ソースコードをコピー
COPY . .

# コンテナ内部でPrisma Clientを生成
RUN npx prisma generate

# ビルド引数を受け取って環境変数にセット
ARG NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID

# Next.jsアプリのビルド
RUN npm run build

# 2. 実行環境 (Runner)
FROM node:20 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# 実行時に必要なツール (FFmpeg, OpenSSL)
RUN apt-get update && apt-get install -y ffmpeg openssl && rm -rf /var/lib/apt/lists/*

# ビルダーから必要なファイルだけをコピー (軽量化)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# ポート公開
EXPOSE 3000

# サーバー起動 (standaloneモード)
CMD ["node", "server.js"]