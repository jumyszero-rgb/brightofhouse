import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // ビルド時の重い型チェックをスキップしてメモリ不足を防ぎます
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns:[
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "pub-*.r2.dev", // R2のパブリックURLパターン
      },
    ],
    unoptimized: false, 
  },
};

export default nextConfig;