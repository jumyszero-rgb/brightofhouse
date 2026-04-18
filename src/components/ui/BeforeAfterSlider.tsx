// @/src/components/ui/BeforeAfterSlider.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  alt: string;
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  alt,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // マウス/タッチ操作のハンドリング
  const handleMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isResizing || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX =
      "touches" in event ? event.touches[0].clientX : (event as React.MouseEvent).clientX;
    
    // コンテナ内のX座標を計算 (0〜100%)
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;

    setSliderPosition(percent);
  };

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);

  // グローバルなイベントリスナーでドラッグ終了を検知
  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto aspect-video overflow-hidden rounded-xl cursor-col-resize select-none shadow-lg"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {/* After画像 (背景として配置) */}
      <Image
        src={afterSrc}
        alt={`After: ${alt}`}
        fill
        className="object-cover"
        priority
      />
      
      {/* ラベル: After */}
      <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-md z-10">
        After
      </div>

      {/* Before画像 (クリップして上に重ねる) */}
      <div
        className="absolute top-0 left-0 h-full w-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Image
          src={beforeSrc}
          alt={`Before: ${alt}`}
          fill
          className="object-cover"
          priority
        />
        {/* ラベル: Before */}
        <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded-md z-10">
          Before
        </div>
      </div>

      {/* スライダーバー */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* 中央のハンドル */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md text-blue-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
              transform="rotate(-90 12 12)"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}