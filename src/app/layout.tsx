// @/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav"; // ▼ 追加

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "北海道ブライトオブハウス | 札幌のハウスクリーニング・特殊清掃",
  description: "札幌市を中心にハウスクリーニング、エアコン清掃、遺品整理、特殊清掃を行う北海道ブライトオブハウスの公式サイトです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {/* ▼ 修正: pb-16 md:pb-0 を追加して、スマホ時のみ下に余白を作る */}
      <body className={`${inter.className} text-slate-800 pb-16 md:pb-0`}>
        
        <Header />

        <div className="pt-16">
          {children}
        </div>

        <footer className="bg-slate-900 text-slate-400 py-12">
          {/* ...フッターの中身（変更なし）... */}
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

        {/* ▼ 追加: スマホ用ボトムナビ */}
        <BottomNav />

      </body>
    </html>
  );
}