// @/src/components/HomeClient.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  settings: any;
  videos: any[];
  children: React.ReactNode;
};

export default function HomeClient({ settings, videos, children }: Props) {
  const pcVideos = videos.filter((v) => v.deviceType === "pc");
  const mobileVideos = videos.filter((v) => v.deviceType === "mobile");
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const phoneNumber = "0120-792-684";

  return (
    <main className="flex flex-col min-h-screen bg-slate-50">

      {/* 動画再生モーダル */}
      {playingVideo && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center animate-in fade-in duration-300 p-4">
          <div className="absolute inset-0" onClick={() => setPlayingVideo(null)}></div>
          <div className="relative w-full max-w-5xl max-h-screen flex flex-col items-center">
            <video
              className="w-full h-full max-h-[80vh] object-contain shadow-2xl rounded-lg bg-black"
              src={playingVideo}
              autoPlay
              controls
              playsInline
            />
            <button
              onClick={() => setPlayingVideo(null)}
              className="mt-6 bg-white/10 border border-white/30 text-white px-8 py-2 rounded-full hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <span className="text-xl">×</span> 閉じる
            </button>
          </div>
        </div>
      )}

      {/* --- 1. ヒーローセクション --- */}
      <div
        className={`relative w-full ${settings.mobileHeight} ${settings.pcHeight} bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 overflow-hidden shadow-md z-10 flex items-center justify-center`}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-white/5 mix-blend-overlay"></div>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-cyan-300/20 rounded-full blur-2xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 text-center text-white flex flex-col items-center gap-4 z-20 w-full">

          {/* 実績バッジ */}
          <div className="flex flex-wrap justify-center gap-3 mb-2">
            <span className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs md:text-sm font-bold px-4 py-1.5 rounded-full">
              ⭐ 口コミ★4.9（200件超）
            </span>
            <span className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs md:text-sm font-bold px-4 py-1.5 rounded-full">
              💰 札幌最安水準
            </span>
          </div>

          {/* ★ 変更: H1にサブタイトルも含める（見た目は変わらない） */}
          <h1 className="w-full">
            <span className="block font-bold tracking-wider drop-shadow-md mb-2 leading-tight whitespace-nowrap text-[min(6vw,3rem)] md:text-5xl">
              {settings.title}
            </span>
            <span className="block font-medium opacity-90 leading-relaxed whitespace-nowrap text-[min(3.5vw,1.125rem)] md:text-lg">
              {settings.subtitle}
            </span>
          </h1>

          {/* アクションボタン */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <Link
              href={settings.btn1Link}
              className="bg-white text-blue-600 px-6 py-3 rounded-full text-sm md:text-base font-bold hover:bg-blue-50 hover:scale-105 transition-all shadow-lg min-w-[140px]"
            >
              {settings.btn1Text}
            </Link>
            <Link
              href={settings.btn2Link}
              className="bg-blue-700/40 border border-white/40 text-white px-6 py-3 rounded-full text-sm md:text-base font-bold hover:bg-blue-700 hover:border-white/80 transition-all backdrop-blur-sm min-w-[140px]"
            >
              {settings.btn2Text}
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

      {/* --- 動画ギャラリー --- */}
      {(pcVideos.length > 0 || mobileVideos.length > 0) && (
        <div className="py-12 px-4 bg-white border-t border-slate-200">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
              <span className="text-red-600 text-xl">▶</span>
              <h2 className="text-lg font-bold text-slate-800">プロモーション動画</h2>
              <span className="text-xs text-slate-400 ml-auto">※クリックで再生</span>
            </div>

            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
              {pcVideos.map((video) => (
                <div key={video.id} className="group cursor-pointer" onClick={() => setPlayingVideo(video.videoUrl)}>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 shadow-sm group-hover:shadow-md transition-all">
                    <div className="aspect-video bg-black rounded overflow-hidden relative shadow-inner">
                      <video className="w-full h-full object-contain pointer-events-none" src={video.videoUrl} muted playsInline />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                        <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <span className="text-red-600 text-base ml-1">▶</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="mt-2 font-bold text-slate-700 text-xs group-hover:text-blue-600 transition-colors">{video.title}</h3>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid md:hidden grid-cols-2 gap-4">
              {mobileVideos.map((video) => (
                <div key={video.id} className="group cursor-pointer" onClick={() => setPlayingVideo(video.videoUrl)}>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 shadow-sm">
                    <div className="aspect-[9/16] w-full bg-black rounded overflow-hidden relative shadow-inner">
                      <video className="w-full h-full object-cover pointer-events-none" src={video.videoUrl} muted playsInline />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-red-600 text-sm ml-0.5">▶</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="mt-2 font-bold text-slate-700 text-[10px] text-center line-clamp-2">{video.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
