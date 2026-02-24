// @/src/app/page.tsx
import prisma from "@/lib/prisma";
import HomeClient from "@/components/HomeClient";
import AfterImageMarquee from "@/components/AfterImageMarquee"; // 追加
import TopPriceSection from "@/components/TopPriceSection";     // 追加

export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. ヒーロー設定を取得
  const settings = await prisma.heroSettings.findUnique({
    where: { id: "main" },
  });

  // 2. 動画リストを取得
  const videos = await prisma.promotionVideo.findMany({
    orderBy: { createdAt: "desc" },
  });

  // 3. 実績画像（Afterのみ）を取得してスライダー用に加工
  const beforeAfterItems = await prisma.beforeAfter.findMany({
    orderBy: { createdAt: "desc" },
    take: 10, // 最新10件
    select: { afterUrl: true }, // After画像だけ取得
  });
  const afterImages = beforeAfterItems.map(item => item.afterUrl);

  // デフォルト値
  const defaultSettings = {
    title: "北海道ブライトオブハウス",
    subtitle: "ハウスクリーニング / エアコン清掃 / 特殊清掃",
    mobileHeight: "h-[50vh]",
    pcHeight: "md:h-[65vh]",
    btn1Text: "無料お見積り",
    btn1Link: "/contact",
    btn2Text: "料金を見る",
    btn2Link: "/service",
  };

  return (
    <>
      {/* ヒーロー & 動画エリア */}
      <HomeClient 
        settings={settings || defaultSettings} 
        videos={videos} 
      />

      {/* ▼ 追加: 実績画像スライダー */}
      {afterImages.length > 0 && (
        <AfterImageMarquee images={afterImages} />
      )}

      {/* ▼ 追加: 料金セクション */}
      <TopPriceSection />
    </>
  );
}