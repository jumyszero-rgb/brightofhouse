// @/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Breadcrumbs from "@/components/Breadcrumbs"; // パンくずリスト

// Google Analytics
import { GoogleAnalytics } from '@next/third-parties/google';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://brightofhouse.jp"),
  title: {
    // 検索結果でクリックされやすいよう、主要サービスを左側に配置
    default: "札幌のハウスクリーニング・水回り清掃・ゴミ屋敷片付け｜北海道ブライトオブハウス",
    template: "%s｜北海道ブライトオブハウス",
  },
  // 検索結果の説明文。PCでもスマホでも読み切れる約100〜120文字で、強みとエリアを簡潔にアピール。
  description: "札幌市および近郊エリアのハウスクリーニング、水回り清掃、高圧洗浄、クロス再生はお任せください。ガンコな汚れもプロの技術で徹底リセット。ゴミ屋敷清掃・遺品整理は北海道全域（全道）へ出張対応いたします。お見積り無料。",
  // 検索エンジンに認識させたい重要キーワードを網羅
  keywords: [
    "札幌",
    "北海道",
    "ハウスクリーニング",
    "水回りクリーニング",
    "高圧洗浄",
    "クロス再生",
    "床清掃",
    "ゴミ屋敷清掃",
    "遺品整理",
    "片付け"
  ],
  openGraph: {
    // SNS等でシェアされた際に表示されるタイトルと説明文
    title: "札幌のハウスクリーニング・水回り清掃｜北海道ブライトオブハウス",
    description: "札幌近郊のハウスクリーニングから、北海道全域のゴミ屋敷清掃・遺品整理まで。プロの技術で見違えるほどの輝きを取り戻します。",
    url: "https://brightofhouse.jp",
    siteName: "北海道ブライトオブハウス",
    locale: "ja_JP",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="ja">
      <body className={`${inter.className} text-slate-800 pb-16 md:pb-0`}>
        
        {/* ヘッダーナビゲーション */}
        <Header />

        <div className="pt-16">
          {/* ▼ 追加: パンくずリストをコンテンツの最上部に配置 */}
          <Breadcrumbs />
          
          {children}
        </div>

        {/* フッター */}
        <footer className="bg-slate-900 text-slate-400 py-12">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">北海道ブライトオブハウス</h3>
              <p>札幌市白石区東札幌五条二丁目6番10<br />ビッグバーンズマンション東札幌2-105号</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/" className="hover:text-white">トップページ</Link>
              <Link href="/service" className="hover:text-white">サービス・料金</Link>
              <Link href="/before-after" className="hover:text-white">実績紹介（Before/After）</Link>
              <Link href="/company" className="hover:text-white">会社概要</Link>
              <Link href="/contact" className="hover:text-white">お問い合わせ</Link>
            </div>
            <div>
              <Link href="/admin" className="text-xs text-slate-600 hover:text-slate-500">
                管理者ログイン
              </Link>
              <p className="mt-4">&copy; {new Date().getFullYear()} Hokkaido Bright of House</p>
            </div>
          </div>
        </footer>

        {/* スマホ用ボトム固定ナビ */}
        <BottomNav />

        {/* Google Analytics 計測タグ */}
        {gaId && <GoogleAnalytics gaId={gaId} />}

      </body>
    </html>
  );
}