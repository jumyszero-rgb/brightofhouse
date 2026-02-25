# 1. ビルド環境 (Builder)
FROM node:20-alpine AS builder
WORKDIR /app

# ビルドに必要なツール
RUN apk add --no-cache openssl

# 依存関係のインストール
COPY package*.json ./
RUN npm ci

# ソースコードをコピー
COPY . .

# Prismaクライアント生成
RUN npx prisma generate

# ▼ 追加: ビルド引数を受け取って環境変数にセット
ARG NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID

# Next.jsアプリのビルド
RUN npm run build

# 2. 実行環境 (Runner)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# 外部接続許可
ENV HOSTNAME="0.0.0.0"

# 実行時に必要なツール (動画圧縮用のFFmpeg、DB用のOpenSSL)
RUN apk add --no-cache openssl ffmpeg

# ビルダーから必要なファイルだけをコピー (軽量化)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# ポート公開
EXPOSE 3000

# サーバー起動 (standaloneモード)
CMD ["node", "server.js"]