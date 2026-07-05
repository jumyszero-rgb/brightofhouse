// @/src/components/SiteShell.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Breadcrumbs from "@/components/Breadcrumbs";
import LpHeader from "@/components/lp/LpHeader";
import LpFooter from "@/components/lp/LpFooter";

/**
 * /lp 配下は「広告用の最小レイアウト」（ナビ無しヘッダ＋会社情報のみのフッタ）に切り替える。
 * それ以外は従来どおり Header / Breadcrumbs / footer / BottomNav を出す。
 *
 * root layout が <html>/<body> を持っているため、入れ子 layout では親の chrome を消せない。
 * そこで chrome をこの client コンポーネントに集約し、pathname で出し分けている。
 * children はサーバーコンポーネントのまま渡るので本文のSSRは落ちない。
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLp = pathname?.startsWith("/lp");

  if (isLp) {
    return (
      <>
        <LpHeader />
        <main>{children}</main>
        <LpFooter />
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="pt-16">
        <Breadcrumbs />
        {children}
      </div>

      <footer className="bg-slate-900 text-slate-400 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <h3 className="text-white font-bold text-xl mb-6">
              北海道ブライトオブハウス
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              運営：合同会社むすびえむ
              <br />
              所在地：〒003-0005 北海道札幌市白石区東札幌五条二丁目6番10
              <br />
              ビッグバーンズマンション東札幌2-105号
            </p>
            <div className="bg-white/5 p-6 rounded-xl border border-white/10 inline-block">
              <p className="text-xs text-slate-400 mb-1">
                フリーダイヤル（9:00-18:00）
              </p>
              <p className="text-2xl font-black text-white tracking-widest">
                0120-792-684
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 border-l-4 border-blue-500 pl-3">
              サービス
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  トップページ
                </Link>
              </li>
              <li>
                <Link href="/service" className="hover:text-white transition-colors">
                  サービス・料金表
                </Link>
              </li>
              <li>
                <Link href="/before-after" className="hover:text-white transition-colors">
                  清掃実績紹介
                </Link>
              </li>
              <li>
                <Link href="/area" className="hover:text-white transition-colors">
                  対応エリア一覧
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 border-l-4 border-blue-500 pl-3">
              その他
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  お掃除知恵袋ブログ
                </Link>
              </li>
              <li>
                <Link href="/company" className="hover:text-white transition-colors">
                  会社概要
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  無料見積・相談
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  rel="nofollow"
                  className="text-slate-600 hover:text-slate-400 transition-colors mt-4 block"
                >
                  管理者ログイン
                </Link>
              </li>
            </ul>
            <p className="mt-10 text-xs text-slate-500">
              &copy; {new Date().getFullYear()} Hokkaido Bright of House
            </p>
          </div>
        </div>
      </footer>

      <BottomNav />
    </>
  );
}
