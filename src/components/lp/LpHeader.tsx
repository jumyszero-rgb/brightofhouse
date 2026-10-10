// @/src/components/lp/LpHeader.tsx
import Link from "next/link";
import PhoneLink from "@/components/PhoneLink";

/**
 * LP専用の最小ヘッダ。グローバルナビは置かない（離脱導線を消す）。
 * ロゴ＋電話CTAのみ。電話は PhoneLink 経由で、広告流入時は
 * Google広告の通話コンバージョン用番号（0800）に自動で置き換わる。
 */
export default function LpHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-800 min-w-0">
          <img src="/icon.png" alt="北海道ブライトオブハウス" className="w-7 h-7 rounded shrink-0" />
          <span className="text-xs sm:text-sm md:text-base whitespace-nowrap truncate">北海道ブライトオブハウス</span>
        </Link>

        <PhoneLink
          className="flex items-center gap-1 bg-blue-600 text-white font-bold text-xs sm:text-sm px-2.5 sm:px-3 py-2 rounded-full hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
          prefix={<span aria-hidden>📞</span>}
          numberClassName="tracking-wide"
        />
      </div>
    </header>
  );
}
