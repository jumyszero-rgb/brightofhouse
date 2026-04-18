// @/src/components/BottomNav.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // アクティブなメニューの色を変える
  const getItemClass = (path: string) => {
    const isActive = pathname === path;
    return `flex flex-col items-center justify-center w-full h-full pt-1 ${
      isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
    }`;
  };

  // 電話番号（実際のものに書き換えてください）
  const phoneNumber = "0120792684"; 
  // LINE公式アカウントのURL（取得していれば設定）
  const lineUrl = "https://line.me/ti/p/RBwKccvQ1O"; 

  return (
    <>
      {/* --- ボトムナビ本体 --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 pb-[env(safe-area-inset-bottom)]">
        <nav className="flex justify-around items-center h-16">
          
          {/* 1. 料金 */}
          <Link href="/service" className={getItemClass("/service")}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-bold mt-0.5">料金</span>
          </Link>

          {/* 2. 実績 */}
          <Link href="/before-after" className={getItemClass("/before-after")}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] font-bold mt-0.5">実績</span>
          </Link>

          {/* 3. 電話 (直接発信) */}
          <a href={`tel:${phoneNumber}`} className="flex flex-col items-center justify-center w-full h-full pt-1 text-slate-400 hover:text-green-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-[10px] font-bold mt-0.5">電話</span>
          </a>

          {/* 4. 相談 (メニューを開く) */}
          <button 
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center justify-center w-full h-full pt-1 ${isMenuOpen ? "text-blue-600" : "text-slate-400"}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-[10px] font-bold mt-0.5">相談</span>
          </button>

        </nav>
      </div>

      {/* --- 相談メニュー (ポップアップ) --- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
          {/* 背景クリックで閉じる */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          ></div>

          {/* メニュー本体 */}
          <div className="relative w-full bg-white rounded-t-2xl p-6 pb-10 animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
            
            <h3 className="text-center font-bold text-lg text-slate-800 mb-6">
              お問い合わせ方法を選択
            </h3>

            <div className="space-y-4">
              {/* LINEボタン */}
              <a 
                href={lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-[#06C755] text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity"
              >
                {/* LINEアイコン */}
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.5c-5.5 0-10 3.6-10 8 0 2.3 1.2 4.4 3.2 5.9.4.2.6.7.5 1.1-.2.8-.7 2.2-.8 2.6 0 .1 0 .2.2.2.5 0 2.7-1.1 3.8-1.7.3-.2.7-.2 1.1-.1 1.3.3 2.7.5 4 .5 5.5 0 10-3.6 10-8s-4.5-8-10-8z"/>
                </svg>
                LINEで気軽に相談する
              </a>

              {/* メールフォームボタン */}
              <Link 
                href="/contact"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-3 w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                メールフォームで見積り依頼
              </Link>
            </div>

            <button 
              onClick={() => setIsMenuOpen(false)}
              className="mt-6 w-full py-3 text-slate-500 font-bold border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}