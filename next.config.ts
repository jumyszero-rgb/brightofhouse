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

  async redirects() {
    return [
      // ==========================================
      // 1. 水回りクリーニング関連（旧 /mizumawaric/）
      // ==========================================
      { source: "/mizumawaric", destination: "/service/water-area-cleaning-sapporo", permanent: true },
      { source: "/mizumawaric/busroomc.html", destination: "/service/bathroom-cleaning-hokkaido", permanent: true },
      { source: "/mizumawaric/kittin_c.html", destination: "/service/kitchen-cleaning-service-details", permanent: true },
      { source: "/mizumawaric/mizumawari_set.html", destination: "/service/water-area-cleaning-sapporo", permanent: true },
      { source: "/mizumawaric/mizumawari_singleaitem", destination: "/service/water-area-cleaning-sapporo", permanent: true },
      { source: "/mizumawaric/mizumawari_singleaitem/kittin_c.html", destination: "/service/kitchen-cleaning-service-details", permanent: true },
      { source: "/mizumawaric/mizumawari_singleaitem/rangehoodc.html", destination: "/service/range-hood-cleaning-sapporo", permanent: true },
      { source: "/mizumawaric/:path*", destination: "/service/water-area-cleaning-sapporo", permanent: true },

      // ==========================================
      // 2. ゴミ屋敷・お片付け関連
      // ==========================================
      { source: "/gomiyasiki_c", destination: "/service/gomi-yashiki-cleaning-sapporo", permanent: true },
      { source: "/gomiyasiki_c/:path*", destination: "/service/gomi-yashiki-cleaning-sapporo", permanent: true },
      { source: "/okatazuke_okomari", destination: "/service/gomi-yashiki-cleaning-sapporo", permanent: true },
      { source: "/okatazuke_okomari/:path*", destination: "/service", permanent: true },

      // ==========================================
      // 3. 会社概要・お問い合わせ・固定ページ
      // ==========================================
      { source: "/jigyosho_gaiyou.html", destination: "/company", permanent: true },
      { source: "/otoiawase.html", destination: "/contact", permanent: true },
      { source: "/privacy.html", destination: "/", permanent: true },
      { source: "/terms.html", destination: "/", permanent: true },
      { source: "/okomari_1.html", destination: "/service", permanent: true },
      { source: "/sitemap.html", destination: "/", permanent: true },

      // ==========================================
      // 4. 旧ブログカテゴリ → 新ブログ
      // ==========================================
      { source: "/category1/:path*", destination: "/blog", permanent: true },
      { source: "/category6", destination: "/blog", permanent: true },
      { source: "/category6/:path*", destination: "/blog", permanent: true },
      { source: "/category16", destination: "/blog", permanent: true },
      { source: "/category16/:path*", destination: "/blog", permanent: true },

      // ==========================================
      // 5. /src/ ソースコード露出ブロック
      // ==========================================
      { source: "/src/:path*", destination: "/", permanent: true },

      // ==========================================
      // 6. /lp トップ → 最新LP
      // ==========================================
      { source: "/lp", destination: "/", permanent: false },

      // ==========================================
      // 7. ゴミURL
      // ==========================================
      { source: "/%24", destination: "/", permanent: true },
      { source: "/%26", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;