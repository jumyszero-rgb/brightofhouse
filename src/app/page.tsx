// @/src/app/page.tsx
import prisma from "@/lib/prisma";
import HomeClient from "@/components/HomeClient";
import AfterImageMarquee from "@/components/AfterImageMarquee";
import TopPriceSection from "@/components/TopPriceSection";
import ServiceArea from "@/components/ServiceArea";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. ヒーロー設定の取得
  const settings = await prisma.heroSettings.findUnique({ where: { id: "main" } });

  // 2. 動画リストの取得
  const videos = await prisma.promotionVideo.findMany({ orderBy: { createdAt: "desc" } });

  // 3. 実績画像の取得
  const beforeAfterItems = await prisma.beforeAfter.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { afterUrl: true },
  });
  const afterImages = beforeAfterItems.map(item => item.afterUrl);

  // 4. キャンペーン用LPの取得 (トップ表示フラグONかつ公開中)
  const featuredLPs = await prisma.landingPage.findMany({
    where: { showOnHome: true, status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    take: 3,
  });

  const defaultSettings = {
    title: "北海道ブライトオブハウス",
    subtitle: "水回りクリーニング / ハウスクリーニング / ゴミ屋敷清掃",
    mobileHeight: "h-[50vh]",
    pcHeight: "md:h-[65vh]",
    btn1Text: "無料お見積り",
    btn1Link: "/contact",
    btn2Text: "料金を見る",
    btn2Link: "/service",
  };

  return (
    <HomeClient settings={settings || defaultSettings} videos={videos}>
      
      {/* キャンペーンバナーエリア */}
      {featuredLPs.length > 0 && (
        <section className="bg-white py-10 px-4 border-b border-slate-100">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">HOT</span>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">キャンペーン情報</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredLPs.map((lp) => (
                <Link 
                  key={lp.id} 
                  href={`/lp/${lp.slug}`} 
                  className="group relative flex flex-col justify-center bg-gradient-to-br from-red-500 to-orange-500 p-5 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all overflow-hidden text-white"
                >
                  <div className="relative z-10">
                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full mb-2 inline-block">CAMPAIGN</span>
                    <h3 className="font-black text-lg leading-tight mb-1 group-hover:underline">{lp.title}</h3>
                    <p className="text-xs opacity-90 line-clamp-1">{lp.catchphrase}</p>
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:translate-x-2 transition-transform">
                    <span className="text-4xl">➝</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 実績スライダー */}
      {afterImages.length > 0 && (
        <AfterImageMarquee images={afterImages} />
      )}

      {/* 人気メニュー・料金 */}
      <TopPriceSection />

      {/* 対応エリア */}
      <ServiceArea />

    </HomeClient>
  );
}