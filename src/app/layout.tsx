// @/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import { GoogleAnalytics } from "@next/third-parties/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://brightofhouse.jp"),
  title: {
    default: "札幌の水回りクリーニング・ハウスクリーニング｜北海道ブライトオブハウス",
    template: "%s｜北海道ブライトオブハウス",
  },
  description:
    "札幌市を中心に、浴室・キッチン等の水回り清掃から、壁紙再生・床ワックス剥離、ゴミ屋敷片付け・遺品整理までプロの技術で迅速対応。お見積り無料。",
  // canonical は各ページで個別設定（layout には置かない）
  openGraph: {
    title: "北海道ブライトオブハウス",
    description:
      "プロの技術で、見違えるほどの輝きを。札幌のハウスクリーニング専門店。",
    url: "https://brightofhouse.jp",
    siteName: "北海道ブライトオブハウス",
    locale: "ja_JP",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = "G-LMELPVPT3Z";

  return (
    <html lang="ja">
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="北海道ブライトオブハウス 公式ブログ"
          href="/rss.xml"
        />
      </head>
      <body className={`${inter.className} text-slate-800 pb-16 md:pb-0`}>
        {/* chrome（Header/footer等）は SiteShell が pathname で出し分ける */}
        <SiteShell>{children}</SiteShell>

        {/* 計測タグは SiteShell の外＝全ページ（LP含む）で必ず読み込む */}
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17996016781"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-17996016781');
              gtag('config', 'AW-17996016781/DTKqCPuhmawcEI3ZlYVD', {
                'phone_conversion_number': '0120-792-684'
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
