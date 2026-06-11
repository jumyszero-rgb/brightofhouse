// @/src/components/lp/LpHeader.tsx
import Link from "next/link";

/**
 * LP専用の最小ヘッダ。グローバルナビは置かない（離脱導線を消す）。
 * ロゴ＋電話CTAのみ。電話番号は 0120-792-684 を表示することで
 * Google広告の通話コンバージョン（phone_conversion_number）も拾える。
 */
export default function LpHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-800">
          <img src="/icon.png" alt="北海道ブライトオブハウス" className="w-7 h-7 rounded" />
          <span className="text-sm md:text-base">北海道ブライトオブハウス</span>
        </Link>

        <a
          href="tel:0120-792-684"
          className="flex items-center gap-1.5 bg-blue-600 text-white font-bold text-sm px-3 py-2 rounded-full hover:bg-blue-700 transition-colors"
        >
          <span aria-hidden>📞</span>
          <span className="tracking-wide">0120-792-684</span>
        </a>
      </div>
    </header>
  );
}
