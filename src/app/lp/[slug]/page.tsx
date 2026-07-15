// @/src/app/lp/[slug]/page.tsx
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ServicePageBooking from "@/components/booking/ServicePageBooking";
import { bookingSelectionToBookingData } from "@/lib/bookingMenuToBookingData";
import LpTemplate from "@/components/lp/LpTemplate";
import { landingPageToLpContent } from "@/lib/lpRichContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "true";
  const lp = await prisma.landingPage.findUnique({
    where: { slug, category: "CAMPAIGN" }
  });

  if (!lp || (lp.status === "DRAFT" && !isPreview)) return { title: "ページが見つかりません" };


    return {
    title: lp.title,
    description: lp.metaDescription || lp.catchphrase || "北海道ブライトオブハウスのお得なキャンペーン情報です。",
    ...(lp.noIndex && { robots: { index: false, follow: true } }),
    alternates: { canonical: lp.canonicalUrl || `/lp/${lp.slug}` },
    openGraph: {
      title: lp.title,
      description: lp.metaDescription || lp.catchphrase || "",
      images: lp.heroImage ? [lp.heroImage] : [],
      url: `https://brightofhouse.jp/lp/${lp.slug}`,
    },
  };

}

export default async function LPPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "true";
  const subMenusInclude = {
    subMenus: {
      include: { options: { orderBy: { order: "asc" as const } } },
      orderBy: { order: "asc" as const },
    },
    options: { orderBy: { order: "asc" as const } },
  } as const;

  const lp = await prisma.landingPage.findUnique({
    where: { slug, category: "CAMPAIGN" },
    include: {
      bookingMenus: { include: subMenusInclude },
      bookingCategories: { include: { menus: { include: subMenusInclude } } },
      beforeAfters: { orderBy: { createdAt: "desc" as const } },
      menuOptionRefs: true,
    },
  });

  if (!lp || (lp.status === "DRAFT" && !isPreview)) notFound();

  const phoneNumber = "0120-792-684";
  const lineUrl = "https://line.me/ti/p/RBwKccvQ1O";

  // 予約マスター(BookingMenu/BookingCategory)にリンクされている場合は常にそちらを正とする（価格ズレ防止）
  const effectiveBookingData = (lp.bookingMenus.length > 0 || lp.bookingCategories.length > 0)
    ? bookingSelectionToBookingData(lp.bookingCategories, lp.bookingMenus)
    : (lp.bookingData as any);

  // リッチテンプレート（静的LPと同等のセクション構成）で描画する場合
  if (lp.templateStyle === "RICH") {
    return (
      <>
        {isPreview && (
          <div className="bg-yellow-400 text-black text-center py-2 text-sm font-bold sticky top-0 z-50">
            ⚠ プレビュー表示中（このページは公開されていません）
          </div>
        )}
        <LpTemplate content={landingPageToLpContent(lp)} bookingData={effectiveBookingData} />
      </>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20 text-black">
      {/* プレビューバナー */}
      {isPreview && (
        <div className="bg-yellow-400 text-black text-center py-2 text-sm font-bold sticky top-0 z-50">
          ⚠ プレビュー表示中（このページは公開されていません）
        </div>
      )}

      {/* ナビ */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
            <span>←</span> 公式サイト
          </Link>
          <Link href="/contact" className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm hover:bg-red-700 transition-colors">
            無料相談
          </Link>
        </div>
      </nav>

      {/* ヒーロー */}
      <div className="relative w-full py-16 md:py-24 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 border-b-[12px] border-yellow-400">
        {lp.heroImage && (
          <Image src={lp.heroImage} alt={lp.title} fill className="object-cover opacity-40 mix-blend-overlay" priority />
        )}
        <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto w-full">
          {/* H1: キャッチコピーを最初に大きく */}
          <h1 className="text-3xl md:text-6xl font-black leading-tight drop-shadow-lg mb-6">
            {lp.catchphrase || lp.title}
          </h1>
          {/* サブコピー: キャッチの下に */}
          {lp.subCopy && (
            <p className="inline-block bg-yellow-400 text-red-700 text-xs md:text-xl font-black px-5 py-2 rounded-full shadow-lg border-2 border-white">
              {lp.subCopy}
            </p>
          )}
        </div>
        {/* ページタイトル: 左上に小さく（SEO用H1ではなくただのラベル） */}
        <div className="absolute top-4 left-4 z-10">
          <span className="text-white/60 text-[10px] font-bold">{lp.title}</span>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-12 border border-slate-200">
          {/* タイトル（h2）は非表示 */}

          {/* 本文 */}
          {lp.content && (
            <div
              className="ql-content prose prose-slate prose-base md:prose-xl max-w-none text-slate-700 mb-16 leading-loose"
              dangerouslySetInnerHTML={{ __html: lp.content }}
            />
          )}

          {/* 予約・お見積りフォーム（予約メニュー設定時のみ表示） */}
          {effectiveBookingData && (
            <div id="booking" className="mb-16 scroll-mt-20">
              <ServicePageBooking pageTitle={lp.title} bookingData={effectiveBookingData} />
            </div>
          )}

          {/* 下部CTA（ON/OFF制御） */}
          {lp.showBottomCta !== false && (
            <div className="bg-gradient-to-br from-red-600 to-orange-500 rounded-2xl p-6 md:p-10 text-center text-white shadow-2xl relative overflow-hidden">
              <p className="font-black text-xl md:text-2xl mb-6 text-yellow-200">
                ＼ まずはお気軽にご相談ください ／
              </p>

              <div className="mb-8 bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20 max-w-2xl mx-auto">
                <p className="text-base font-bold mb-2 text-white">お急ぎの方はお電話で（9:00-18:00）</p>
                <a href={`tel:${phoneNumber.replace(/-/g, "")}`} className="flex items-center justify-center gap-3 mb-4 group transition-transform hover:scale-105">
                  <span className="text-3xl md:text-4xl">📞</span>
                  <span className="text-4xl md:text-6xl font-black tracking-widest font-mono text-white">{phoneNumber}</span>
                </a>
                <p className="inline-block bg-yellow-400 text-red-800 font-bold px-4 py-1.5 rounded-full text-sm md:text-base">
                  ※ご相談の際は「キャンペーンページを見た」とお伝えください
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
                <a
                  href={lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full md:flex-1 bg-[#06C755] text-white font-black py-4 px-6 rounded-full shadow-lg hover:brightness-110 transition-all text-lg"
                >
                  <span className="text-2xl">LINE</span> で手軽に相談する
                </a>

                <Link
                  href={lp.ctaLink || "/contact"}
                  className="flex items-center justify-center gap-3 w-full md:flex-1 bg-yellow-400 text-red-700 font-black py-4 px-6 rounded-full shadow-lg hover:bg-yellow-500 transition-all text-lg"
                >
                  {lp.ctaText || "お見積り依頼はこちら"}
                </Link>
              </div>

              <p className="md:hidden mt-6 text-xs font-bold opacity-90 text-white">
                ※ご相談の際「キャンペーンを見た」とお伝えください
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
