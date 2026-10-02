// @/src/components/BottomNav.tsx
"use client";

import Link from "next/link";

/**
 * スマホ用 画面下固定ナビ（新トップのデザインに統一）
 * 電話する / LINE相談 / 無料見積り の3ボタン。PC(md以上)では非表示。
 */
export default function BottomNav() {
  // 電話番号
  const phoneNumber = "0120792684";
  // LINE公式アカウントのURL
  const lineUrl = "https://line.me/ti/p/RBwKccvQ1O";

  return (
    <nav
      aria-label="スマホ用ナビ"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 grid grid-cols-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_12px_rgba(15,30,46,0.08)] pb-[env(safe-area-inset-bottom)]"
    >
      {/* 電話する */}
      <a
        href={`tel:${phoneNumber}`}
        className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-bold leading-tight text-[#0a568f] hover:bg-slate-50"
      >
        <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        電話する
      </a>

      {/* LINE相談 */}
      <a
        href={lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-bold leading-tight text-[#06c755] border-l border-slate-200 hover:bg-slate-50"
      >
        <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        LINE相談
      </a>

      {/* 無料見積り */}
      <Link
        href="/contact"
        className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-black leading-tight text-[#3a2a02] bg-[#f5a524] hover:brightness-105"
      >
        <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
        無料見積り
      </Link>
    </nav>
  );
}
