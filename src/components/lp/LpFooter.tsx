// @/src/components/lp/LpFooter.tsx
import Link from "next/link";

/**
 * LP専用の最小フッタ。会社情報・電話・プライバシーポリシー・コピーライトのみ。
 * （ナビのリンク集は置かない。ただし事業者情報とプラポリは
 *  信頼面＆Google広告のポリシー審査の観点から必須なので残す）
 */
export default function LpFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10 px-4 mt-16">
      <div className="max-w-5xl mx-auto">
        <p className="text-white font-bold text-base mb-3">
          北海道ブライトオブハウス
        </p>
        <p className="text-xs leading-relaxed mb-4">
          運営：合同会社むすびえむ
          <br />
          所在地：〒003-0005 北海道札幌市白石区東札幌五条二丁目6番10
          ビッグバーンズマンション東札幌2-105号
          <br />
          フリーダイヤル：
          <a href="tel:0120-792-684" className="text-white font-bold tracking-wide">
            0120-792-684
          </a>
          （9:00-18:00）
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <Link href="/privacy" className="hover:text-white transition-colors">
            プライバシーポリシー
          </Link>
          <Link href="/company" className="hover:text-white transition-colors">
            会社概要
          </Link>
          <Link href="/" className="hover:text-white transition-colors">
            公式サイト
          </Link>
        </div>
        <p className="mt-8 text-[11px] text-slate-500">
          &copy; {new Date().getFullYear()} Hokkaido Bright of House
        </p>
      </div>
    </footer>
  );
}
