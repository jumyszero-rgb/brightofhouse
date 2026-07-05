// @/src/components/AfterImageMarquee.tsx
"use client";

import Image from "next/image";
import { useRef } from "react";

type Props = {
  images: string[];
};

export default function AfterImageMarquee({ images }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) return null;

  const scrollByCard = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 280, behavior: "smooth" });
  };

  return (
    <div className="w-full bg-slate-50 py-10">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
          <span className="text-blue-500">✨</span> 清掃実績ギャラリー
        </h2>
        <p className="text-xs text-slate-500 mt-1">プロの技術による仕上がりをご覧ください</p>
      </div>

      <div className="relative max-w-6xl mx-auto px-4">
        {/* PC用: 前へ/次へボタン（スマホはタッチスワイプがあるので md 以上のみ表示） */}
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          aria-label="前の画像"
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow-md border border-slate-200 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          aria-label="次の画像"
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow-md border border-slate-200 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
        >
          ›
        </button>

        {/* 横スワイプ／スライドストリップ */}
        <div
          ref={scrollerRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, index) => (
            <div
              key={index}
              className="relative w-64 h-48 flex-shrink-0 snap-start rounded-lg overflow-hidden shadow-md"
            >
              <Image
                src={src}
                alt="清掃後"
                fill
                loading="lazy"
                sizes="256px"
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-tr-lg">
                After
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
