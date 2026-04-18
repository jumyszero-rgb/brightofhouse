// @/src/components/AfterImageMarquee.tsx
"use client";

import Image from "next/image";

type Props = {
  images: string[];
};

export default function AfterImageMarquee({ images }: Props) {
  // 画像が少なすぎるとスクロールが途切れるので、足りない場合は複製して埋める
  const displayImages = images.length < 5 ? [...images, ...images, ...images] : images;

  return (
    <div className="w-full bg-slate-50 py-10 overflow-hidden">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
          <span className="text-blue-500">✨</span> 清掃実績ギャラリー
        </h2>
        <p className="text-xs text-slate-500 mt-1">プロの技術による仕上がりをご覧ください</p>
      </div>

      {/* スクロールコンテナ */}
      <div className="relative w-full flex overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {/* 1セット目 */}
          {displayImages.map((src, index) => (
            <div key={`g1-${index}`} className="relative w-64 h-48 mx-2 rounded-lg overflow-hidden shadow-md flex-shrink-0">
              <Image
                src={src}
                alt="清掃後"
                fill
                className="object-cover hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute bottom-0 left-0 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-tr-lg">
                After
              </div>
            </div>
          ))}
          {/* 2セット目（ループ用） */}
          {displayImages.map((src, index) => (
            <div key={`g2-${index}`} className="relative w-64 h-48 mx-2 rounded-lg overflow-hidden shadow-md flex-shrink-0">
              <Image
                src={src}
                alt="清掃後"
                fill
                className="object-cover hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute bottom-0 left-0 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-tr-lg">
                After
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* アニメーション定義 (Tailwind configを使わず直接styleで埋め込み) */}
      <style jsx>{`
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}