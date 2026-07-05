// @/src/components/HomeClient.tsx
"use client";

import Link from "next/link";

type Props = {
  settings: any;
  children: React.ReactNode;
};

export default function HomeClient({ settings, children }: Props) {
  const phoneNumber = "0120-792-684";

  return (
    <main className="flex flex-col min-h-screen bg-slate-50">

      {/* --- 1. ヒーローセクション --- */}
      {/* 高さ設定は「最低これだけ確保する」min-heightとして扱い、コンテンツがはみ出て文字が切れるのを防ぐ */}
      <div
        className={`relative w-full ${settings.mobileHeight.replace(/^h-/, "min-h-")} ${settings.pcHeight.replace(/:h-/, ":min-h-")} bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 overflow-hidden shadow-md z-10 flex items-center justify-center py-8`}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-white/5 mix-blend-overlay"></div>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-cyan-300/20 rounded-full blur-2xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 text-center text-white flex flex-col items-center gap-4 z-20 w-full">

          {/* 実績バッジ（副次情報として控えめに） */}
          <div className="flex flex-wrap justify-center gap-2 mb-1 opacity-90">
            <span className="bg-white/15 border border-white/25 text-white text-[11px] md:text-xs font-bold px-3 py-1 rounded-full">
              ⭐ 口コミ★4.9（200件超）
            </span>
            <span className="bg-white/15 border border-white/25 text-white text-[11px] md:text-xs font-bold px-3 py-1 rounded-full">
              💰 札幌最安水準
            </span>
          </div>

          <h1 className="w-full">
            <span className="block font-bold tracking-wider drop-shadow-md mb-2 leading-tight whitespace-nowrap text-[min(6vw,3rem)] md:text-5xl">
              {settings.title}
            </span>
            <span className="block font-medium opacity-90 leading-relaxed whitespace-nowrap text-[min(3.5vw,1.125rem)] md:text-lg">
              {settings.subtitle}
            </span>
          </h1>

          {/* アクションボタン: 主要CTA(btn1)を最優先、btn2はテキストリンクで副次化（横並びで高さを抑える） */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4">
            <Link
              href={settings.btn1Link}
              className="bg-white text-blue-600 px-8 py-3.5 rounded-full text-base md:text-lg font-black hover:bg-blue-50 hover:scale-105 transition-all shadow-xl min-w-[200px]"
            >
              {settings.btn1Text}
            </Link>
            <Link
              href={settings.btn2Link}
              className="text-white/90 text-sm font-bold underline underline-offset-4 decoration-white/40 hover:decoration-white transition-colors"
            >
              {settings.btn2Text} →
            </Link>
          </div>

          {/* PC用 特大電話番号 */}
          <div className="hidden md:block mt-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-8 py-3">
            <p className="text-xs opacity-90 mb-1">お急ぎの方はお電話で（9:00-18:00）</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-xl">📞</span>
              <span className="text-3xl font-bold tracking-widest font-mono">{phoneNumber}</span>
            </div>
          </div>

        </div>
      </div>

      {/* --- children --- */}
      {children}

    </main>
  );
}
