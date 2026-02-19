# ./Dockerfile
# Node.jsの公式軽量イメージを使用
FROM node:20-alpine AS base

# 1. 依存関係のインストールフェーズ
FROM base AS deps
WORKDIR /app
# パッケージ情報をコピー
COPY package.json package-lock.json ./
# パッケージをクリーンインストール
RUN npm ci

# 2. アプリケーションのビルドフェーズ
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# standaloneモードでビルドを実行
RUN npm run build

# 3. 本番実行フェーズ
FROM base AS runner
WORKDIR /app

# セキュリティを考慮し、root以外のユーザーで実行
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# publicフォルダと、ビルド成果物をコピー
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# 外部からのアクセスを受け付けるポート
EXPOSE 3000

# アプリケーションの起動
CMD ["node", "server.js"]