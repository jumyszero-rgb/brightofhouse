// @/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Breadcrumbs from "@/components/Breadcrumbs";
import { GoogleAnalytics } from '@next/third-parties/google';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // ▼ 正規URLのベースとなるドメインを設定
  metadataBase: new URL("https://brightofhouse.jp"),
  title: {
    default: "北海道ブライトオブハウス | 札幌のハウスクリーニング・特殊清掃",
    template: "%s | 北海道ブライトオブハウス",
  },
  description: "札幌市を中心に、浴室・キッチン等の水回り清掃から、壁紙再生・床ワックス剥離、ゴミ屋敷片付け・遺品整理までプロの技術で迅速対応。お見積り無料。",
  keywords:["札幌 家 清掃", "札幌 水回り 清掃", "札幌 ハウスクリーニング おすすめ", "空室 清掃 札幌", "退去 清掃 札幌", "ゴミ屋敷 片付け 札幌", "遺品整理 札幌"],
  
  // ▼ Canonicalタグ（重複ページ対策）
  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "北海道ブライトオブハウス",
    description: "プロの技術で、見違えるほどの輝きを。札幌のハウスクリーニング専門店。",
    url: "https://brightofhouse.jp",
    siteName: "北海道ブライトオブハウス",
    locale: "ja_JP",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  // ▼ ファビコンおよびRSS自動検出
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
    other:[
      {
        rel: "alternate",
        type: "application/rss+xml",
        url: "/rss.xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ▼ GA4のID（環境変数が読み込めないトラブル対策として直書き）
  const gaId = "G-LMELPVPT3Z";

  return (
    <html lang="ja">
      <head>
        {/* RSSフィードリンク */}
        <link rel="alternate" type="application/rss+xml" title="北海道ブライトオブハウス 公式ブログ" href="/rss.xml" />
      </head>
      <body className={`${inter.className} text-slate-800 pb-16 md:pb-0`}>
        
        <Header />

        <div className="pt-16">
          {/* ▼ パンくずリストを配置 */}
          <Breadcrumbs />
          {children}
        </div>

        <footer className="bg-slate-900 text-slate-400 py-16 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <h3 className="text-white font-bold text-xl mb-6">北海道ブライトオブハウス</h3>
              <p className="text-sm leading-relaxed mb-4">
                運営：合同会社むすびえむ<br />
                所在地：〒003-0005 北海道札幌市白石区東札幌五条二丁目6番10<br />
                ビッグバーンズマンション東札幌2-105号
              </p>
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 inline-block">
                <p className="text-xs text-slate-400 mb-1">フリーダイヤル（9:00-18:00）</p>
                <p className="text-2xl font-black text-white tracking-widest">0120-792-684</p>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 border-l-4 border-blue-500 pl-3">サービス</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/" className="hover:text-white transition-colors">トップページ</Link></li>
                <li><Link href="/service" className="hover:text-white transition-colors">サービス・料金表</Link></li>
                <li><Link href="/before-after" className="hover:text-white transition-colors">清掃実績紹介</Link></li>
                <li><Link href="/area" className="hover:text-white transition-colors">対応エリア一覧</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 border-l-4 border-blue-500 pl-3">その他</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/blog" className="hover:text-white transition-colors">お掃除知恵袋ブログ</Link></li>
                <li><Link href="/company" className="hover:text-white transition-colors">会社概要</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">無料見積・相談</Link></li>
                <li><Link href="/admin" className="text-slate-600 hover:text-slate-400 transition-colors mt-4 block">管理者ログイン</Link></li>
              </ul>
              <p className="mt-10 text-xs text-slate-500">&copy; {new Date().getFullYear()} Hokkaido Bright of House</p>
            </div>
          </div>
        </footer>

        <BottomNav />
        
       {gaId && <GoogleAnalytics gaId={gaId} />}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17996016781" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-17996016781');
            `,
          }}
        />

      </body>
    </html>
  );
}