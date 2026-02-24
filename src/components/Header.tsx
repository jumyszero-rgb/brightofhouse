// @/src/components/Header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* --- スマホ用 (左: ハンバーガー + ロゴ) --- */}
        <div className="flex items-center gap-3 md:hidden">
          {/* ハンバーガーボタン */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 -ml-2 text-slate-600 hover:text-blue-600 focus:outline-none"
            aria-label="メニューを開く"
          >
            {isOpen ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          
          {/* スマホ用ロゴ画像 (サイズアップ) */}
          <Link href="/" onClick={handleLinkClick} className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="北海道ブライトオブハウス"
              width={200}
              height={50}
              // ▼ 修正: h-8 -> h-10 (40px)
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* --- PC用 (左: ロゴ) --- */}
        <div className="hidden md:block">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image
              src="/images/logo.png"
              alt="北海道ブライトオブハウス"
              width={300}
              height={60}
              // ▼ 修正: h-10 -> h-14 (56px)
              className="h-14 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* --- PC用 (右: ナビゲーション) --- */}
        <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600 items-center">
          <Link href="/service" className="hover:text-blue-600 transition-colors">サービス・料金</Link>
          <Link href="/before-after" className="hover:text-blue-600 transition-colors">実績紹介</Link>
          <Link href="/company" className="hover:text-blue-600 transition-colors">会社概要</Link>
          <Link href="/contact" className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors shadow-sm">
            お問い合わせ
          </Link>
        </nav>
      </div>

      {/* --- スマホ用ドロワーメニュー --- */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-t border-slate-100 shadow-lg animate-in slide-in-from-top-5 duration-200 h-screen">
          <nav className="flex flex-col p-6 space-y-6 text-center">
            <Link 
              href="/" 
              onClick={handleLinkClick}
              className={`text-lg font-bold py-2 ${pathname === "/" ? "text-blue-600" : "text-slate-600"}`}
            >
              トップページ
            </Link>
            <Link 
              href="/service" 
              onClick={handleLinkClick}
              className={`text-lg font-bold py-2 ${pathname === "/service" ? "text-blue-600" : "text-slate-600"}`}
            >
              サービス・料金
            </Link>
            <Link 
              href="/before-after" 
              onClick={handleLinkClick}
              className={`text-lg font-bold py-2 ${pathname === "/before-after" ? "text-blue-600" : "text-slate-600"}`}
            >
              実績紹介 (Before/After)
            </Link>
            <Link 
              href="/company" 
              onClick={handleLinkClick}
              className={`text-lg font-bold py-2 ${pathname === "/company" ? "text-blue-600" : "text-slate-600"}`}
            >
              会社概要
            </Link>
            <Link 
              href="/contact" 
              onClick={handleLinkClick}
              className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold hover:bg-blue-700 transition-colors inline-block mx-auto w-full max-w-xs shadow-lg"
            >
              お問い合わせ
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}