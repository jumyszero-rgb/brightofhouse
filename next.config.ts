// @/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // ▼ ここが重要: R2のドメインを許可する
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "pub-*.r2.dev", // R2のパブリックURLパターン
      },
      // もしカスタムドメインを使っている場合はそれも追加
      // { protocol: "https", hostname: "cdn.brightofhouse.jp" },
    ],
    // 画像最適化を有効にする（デフォルトで有効ですが念のため）
    unoptimized: false, 
  },
};

export default nextConfig;