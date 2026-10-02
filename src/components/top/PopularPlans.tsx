// @/src/components/top/PopularPlans.tsx
import prisma from "@/lib/prisma";
import { cheapestBookingMenu } from "@/lib/bookingMenuToBookingData";
import Link from "next/link";

/**
 * トップの「人気の作業・おすすめプラン」。
 * 予約マスター(BookingMenu)の topFeaturedOrder が設定されたメニューを
 * 小さい順に最大3件表示（最小が人気No.1）。画像・料金は予約マスター連動。
 * 掲載メニューが無い場合は何も表示しない。
 */
export default async function PopularPlans() {
  const menus = await prisma.bookingMenu.findMany({
    where: { topFeaturedOrder: { not: null } },
    orderBy: { topFeaturedOrder: "asc" },
    take: 3,
    select: {
      id: true,
      title: true,
      imageUrl: true,
      recommendPoint: true,
      workContent: true,
      basePrice: true,
      priceNote: true,
      discountPercent: true,
      discountRounding: true,
      webSpecialPrice: true,
      servicePages: {
        where: { status: "PUBLISHED" },
        select: { slug: true },
        take: 1,
      },
    },
  });

  if (menus.length === 0) return null;

  return (
    <section className="py-14 md:py-16 px-4 bg-[#f4f8fb]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-9">
          <p className="text-xs font-bold tracking-[.15em] text-[#0e7ad1]">POPULAR</p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 mt-2">人気の作業・おすすめプラン</h2>
          <p className="text-sm text-slate-500 mt-2">迷ったらこれ。実際によく選ばれているメニューです。</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {menus.map((m, i) => {
            const price = cheapestBookingMenu([m as any]);
            const link = m.servicePages[0]?.slug ? `/service/${m.servicePages[0].slug}` : "/service";
            const desc = m.recommendPoint || (m.workContent ? m.workContent.split("\n").filter(Boolean).slice(0, 2).join(" / ") : "");
            const isNo1 = i === 0;
            return (
              <Link
                key={m.id}
                href={link}
                className={`relative bg-white rounded-2xl overflow-hidden shadow-[0_10px_24px_rgba(15,30,46,.08)] flex flex-col ${isNo1 ? "border-2 border-[#f5a524]" : "border border-[#e7ecf1]"}`}
              >
                {/* 画像（未設定はプレースホルダー） */}
                <div className="relative aspect-[16/9] bg-gradient-to-br from-[#cfe4f5] to-[#e8f3ee] flex items-center justify-center">
                  {m.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.imageUrl} alt={m.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#7fa3bd] text-sm font-bold">施工写真</span>
                  )}
                  {isNo1 && (
                    <span className="absolute top-2 left-2 bg-[#f5a524] text-[#3a2a02] text-[11px] font-black px-3 py-1 rounded-full shadow">
                      人気 No.1
                    </span>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-black text-slate-800 text-[15px] leading-snug">{m.title}</h3>
                  {desc && (
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 flex-1">{desc}</p>
                  )}
                  <div className="mt-3">
                    {price && (price.basePrice > 0 || price.priceNote) ? (
                      <p className="font-black text-[#0a568f]">
                        {price.priceNote && <span className="text-xs font-bold text-slate-500 mr-1">{price.priceNote}</span>}
                        {price.basePrice > 0 &&
                          ((price.discountPercent || price.webSpecialPrice != null) ? (
                            <>
                              <span className="text-xs text-slate-400 line-through mr-1">¥{price.basePrice.toLocaleString()}</span>
                              <span className="text-xl text-[#e0575b]">¥{price.effectivePrice.toLocaleString()}〜</span>
                            </>
                          ) : (
                            <span className="text-xl">¥{price.basePrice.toLocaleString()}〜</span>
                          ))}
                        <span className="text-xs text-slate-400 font-normal ml-1">（税込・目安）</span>
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-slate-500">お見積り</p>
                    )}
                  </div>
                  <span className="inline-block mt-3 bg-[#0e7ad1] text-white text-center font-bold text-[13px] py-2.5 rounded-full">
                    このプランで相談する →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
