import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Dockerコンテナデプロイ用に、必要なファイルだけを出力する設定
  output: "standalone",
};

export default nextConfig;