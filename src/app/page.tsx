// @/src/app/page.tsx
import prisma from "@/lib/prisma";
import HomeClient from "@/components/HomeClient";
import AfterImageMarquee from "@/components/AfterImageMarquee";
import TopPriceSection from "@/components/TopPriceSection";
import ServiceArea from "@/components/ServiceArea"; // 追加

export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await prisma.heroSettings.findUnique({
    where: { id: "main" },
  });

  const videos = await prisma.promotionVideo.findMany({
    orderBy: { createdAt: "desc" },
  });

  const beforeAfterItems = await prisma.beforeAfter.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { afterUrl: true },
  });
  const afterImages = beforeAfterItems.map(item => item.afterUrl);

  const defaultSettings = {
    title: "北海道ブライトオブハウス",
    // ▼ 修正: エアコン削除、ゴミ屋敷追加
    subtitle: "水回りクリーニング / ハウスクリーニング / ゴミ屋敷清掃",
    mobileHeight: "h-[50vh]",
    pcHeight: "md:h-[65vh]",
    btn1Text: "無料お見積り",
    btn1Link: "/contact",
    btn2Text: "料金を見る",
    btn2Link: "/service",
  };

  return (
    <HomeClient 
      settings={settings || defaultSettings} 
      videos={videos}
    >
      {/* ▼ ここにサーバーコンポーネントを配置 (childrenとして渡される) */}
      
      {/* 実績ギャラリー */}
      {afterImages.length > 0 && (
        <AfterImageMarquee images={afterImages} />
      )}

      {/* 料金セクション */}
      <TopPriceSection />

      {/* 対応エリア */}
      <ServiceArea />

    </HomeClient>
  );
}