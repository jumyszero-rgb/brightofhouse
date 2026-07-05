// @/src/components/PromotionVideoGallery.tsx
"use client";

import { useState } from "react";

type Props = {
  videos: any[];
};

export default function PromotionVideoGallery({ videos }: Props) {
  const pcVideos = videos.filter((v) => v.deviceType === "pc");
  const mobileVideos = videos.filter((v) => v.deviceType === "mobile");
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  if (pcVideos.length === 0 && mobileVideos.length === 0) return null;

  return (
    <>
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
                    <video className="w-full h-full object-contain pointer-events-none" src={video.videoUrl} muted playsInline preload="none" />
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
                    <video className="w-full h-full object-cover pointer-events-none" src={video.videoUrl} muted playsInline preload="none" />
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
    </>
  );
}
