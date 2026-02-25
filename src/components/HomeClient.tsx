// @/src/components/HomeClient.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import ServiceArea from "@/components/ServiceArea"; // 追加

type Props = {
  settings: any;
  videos: any[];
};

export default function HomeClient({ settings, videos }: Props) {
  const pcVideos = videos.filter((v) => v.deviceType === "pc");
  const mobileVideos = videos.filter((v) => v.deviceType === "mobile");
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  // 電話番号（設定用）
  const phoneNumber = "0120-792-684";

  return (
    <main className="flex flex-col min-h-screen bg-slate-50">

      {/* --- 動画再生モーダル --- */}
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

        <div className="relative max-w-4xl mx-auto px-4 text-center text-white flex flex-col items-center gap-6 z-20">
          
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-wider drop-shadow-md mb-4 leading-tight">
              {settings.title}
            </h1>
            <p className="text-base md:text-xl opacity-90 font-medium leading-relaxed">
              {settings.subtitle}
            </p>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={settings.btn1Link}
              className="bg-white text-blue-600 px-8 py-3 rounded-full text-base font-bold hover:bg-blue-50 hover:scale-105 transition-all shadow-lg min-w-[160px]"
            >
              {settings.btn1Text}
            </Link>
            <Link
              href={settings.btn2Link}
              className="bg-blue-700/40 border border-white/40 text-white px-8 py-3 rounded-full text-base font-bold hover:bg-blue-700 hover:border-white/80 transition-all backdrop-blur-sm min-w-[160px]"
            >
              {settings.btn2Text}
            </Link>
          </div>

          {/* ▼ 追加: PC用 特大電話番号 (スマホでは非表示 hidden md:block) */}
          <div className="hidden md:block mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-8 py-4">
            <p className="text-sm opacity-90 mb-1">お急ぎの方はお電話で（9:00-18:00）</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">📞</span>
              <span className="text-4xl font-bold tracking-widest font-mono">{phoneNumber}</span>
            </div>
          </div>

        </div>
      </div>


      {/* --- 2. CM・動画ギャラリー --- */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-8 border-b border-slate-100 pb-3">
            <span className="text-red-600 text-xl">▶</span>
            <h2 className="text-xl font-bold text-slate-800">
              プロモーション動画
            </h2>
            <span className="text-xs text-slate-400 ml-auto">
              ※クリックで再生
            </span>
          </div>

          {/* PC用動画リスト */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-8">
            {pcVideos.length > 0 ? (
              pcVideos.map((video) => (
                <div 
                  key={video.id} 
                  className="group cursor-pointer"
                  onClick={() => setPlayingVideo(video.videoUrl)}
                >
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm group-hover:shadow-md transition-all">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden relative shadow-inner">
                      <video
                        className="w-full h-full object-contain pointer-events-none"
                        src={video.videoUrl}
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <span className="text-red-600 text-lg ml-1">▶</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="mt-3 font-bold text-slate-700 text-sm group-hover:text-blue-600 transition-colors">
                      {video.title}
                    </h3>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 col-span-full text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                動画が登録されていません
              </p>
            )}
          </div>

          {/* スマホ用動画リスト */}
          <div className="grid md:hidden grid-cols-2 gap-4">
            {mobileVideos.length > 0 ? (
              mobileVideos.map((video) => (
                <div 
                  key={video.id} 
                  className="group cursor-pointer"
                  onClick={() => setPlayingVideo(video.videoUrl)}
                >
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 shadow-sm">
                    <div className="aspect-[9/16] w-full bg-black rounded overflow-hidden relative shadow-inner">
                      <video
                        className="w-full h-full object-cover pointer-events-none"
                        src={video.videoUrl}
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-red-600 text-base ml-1">▶</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="mt-2 font-bold text-slate-700 text-xs text-center line-clamp-2">
                      {video.title}
                    </h3>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 col-span-full text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                動画が登録されていません
              </p>
            )}
          </div>

        </div>
      </div>

      {/* --- 3. メインメニュー --- */}
      <div className="py-12 px-4 border-t border-slate-200 bg-slate-50/50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/service" className="group flex items-center gap-4 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-slate-100 hover:border-blue-200">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">¥</div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">サービス・料金</h3>
              <p className="text-slate-500 text-sm mt-1">水回りクリーニング、ハウスクリーニング、ゴミ屋敷清掃</p>
            </div>
          </Link>
          <Link href="/before-after" className="group flex items-center gap-4 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-slate-100 hover:border-blue-200">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">✨</div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">Before & After</h3>
              <p className="text-slate-500 text-sm mt-1">清掃実績を写真で公開中</p>
            </div>
          </Link>
          <Link href="/company" className="group flex items-center gap-4 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-slate-100 hover:border-blue-200">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">🏢</div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">会社概要</h3>
              <p className="text-slate-500 text-sm mt-1">運営会社情報、アクセス</p>
            </div>
          </Link>
        </div>
      </div>

      {/* --- 4. 対応エリア (追加) --- */}
      <ServiceArea />

    </main>
  );
}