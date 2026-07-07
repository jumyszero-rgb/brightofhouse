// @/src/app/area/[slug]/page.tsx
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { cheapestBookingMenu } from "@/lib/bookingMenuToBookingData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lp = await prisma.landingPage.findUnique({ 
    where: { 
      slug,
      category: "AREA" 
    } 
  });

  if (!lp || lp.status === "DRAFT") return { title: "ページが見つかりません" };

  return {
    title: lp.title,
    description: lp.metaDescription || lp.catchphrase || `${lp.title}。お見積り無料、迅速対応。`,
    ...(lp.noIndex && { robots: { index: false, follow: true } }),
    alternates: { canonical: lp.canonicalUrl || `/area/${lp.slug}` },
    openGraph: {
      title: lp.title,
      description: lp.catchphrase || "",
      images: lp.heroImage ? [lp.heroImage] : [],
    },
  };
}

export default async function AreaPage({ params }: Props) {
  const { slug } = await params;
  const lp = await prisma.landingPage.findUnique({ 
    where: { 
      slug,
      category: "AREA" 
    } 
  });

  if (!lp || lp.status === "DRAFT") notFound();

  // 内部リンク強化: このエリアからサービス詳細ページへのリンク
  const servicePages = await prisma.servicePage.findMany({
    where: { status: "PUBLISHED", noIndex: false, showOnHome: true },
    select: {
      slug: true, title: true, catchphrase: true, cardIcon: true,
      bookingMenus: { select: { basePrice: true, priceNote: true, discountPercent: true, discountRounding: true, webSpecialPrice: true } },
      bookingCategories: { select: { menus: { select: { basePrice: true, priceNote: true, discountPercent: true, discountRounding: true, webSpecialPrice: true } } } },
    },
    orderBy: { createdAt: "asc" },
    take: 8,
  });

  const phoneNumber = "0120-792-684";
  const lineUrl = "https://line.me/R/ti/p/@your_id"; // ★LINE公式アカウントのURLに変更してください
  const areaName = (lp.linkTitle || lp.title).replace(/のハウスクリーニング.*$/, "").trim();

  // 構造化データ: LocalBusiness（対応エリアを明示）
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "北海道ブライトオブハウス",
    url: `https://brightofhouse.jp/area/${lp.slug}`,
    telephone: phoneNumber,
    address: {
      "@type": "PostalAddress",
      addressLocality: "札幌市白石区",
      addressRegion: "北海道",
      addressCountry: "JP",
    },
    areaServed: {
      "@type": "City",
      name: areaName || lp.title,
    },
  };

  // 構造化データ: パンくずリスト
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "トップ", item: "https://brightofhouse.jp" },
      { "@type": "ListItem", position: 2, name: "地域別サービス一覧", item: "https://brightofhouse.jp/area" },
      { "@type": "ListItem", position: 3, name: lp.title, item: `https://brightofhouse.jp/area/${lp.slug}` },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20 text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/area" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <span>←</span> 地域一覧へ戻る
          </Link>
          <div className="text-xs font-bold text-slate-400">地域限定ページ</div>
        </div>
      </nav>

      <div className="relative w-full py-16 md:py-24 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-500 border-b-[12px] border-blue-100">
        {lp.heroImage && (
          <Image src={lp.heroImage} alt={lp.title} fill className="object-cover opacity-30 mix-blend-overlay" priority />
        )}
        <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto w-full">
          <h1 className="text-3xl md:text-6xl font-black leading-tight drop-shadow-lg">
            {lp.catchphrase || lp.title}
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-12 border border-slate-200">
          {lp.content && (
            <div 
              className="ql-content prose prose-lg md:prose-xl max-w-none text-slate-700 mb-16"
              dangerouslySetInnerHTML={{ __html: lp.content }}
            />
          )}

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 md:p-10 text-center text-white shadow-2xl relative overflow-hidden">
            <p className="font-black text-xl md:text-2xl mb-6 text-white">
              ＼ {lp.title}の皆様、お気軽にご相談ください ／
            </p>

            <div className="hidden md:block mb-8 bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20">
              <p className="text-base font-bold mb-2 text-white">お急ぎの方はお電話で（9:00-18:00）</p>
              <a href={`tel:${phoneNumber.replace(/-/g, "")}`} className="flex items-center justify-center gap-3 mb-4 group transition-transform hover:scale-105">
                <span className="text-3xl">📞</span>
                <span className="text-5xl font-black tracking-widest font-mono text-white">{phoneNumber}</span>
              </a>
              <p className="inline-block bg-white text-blue-800 font-bold px-4 py-1.5 rounded-full text-base">
                地域担当者が迅速にお伺いいたします
              </p>
            </div>

            <Link
              href={lp.ctaLink || "/contact"}
              className="inline-block w-full md:w-auto bg-yellow-400 text-blue-900 text-lg md:text-2xl font-black py-4 px-12 rounded-full shadow-lg hover:bg-yellow-500 transition-all"
            >
              無料お見積りはこちら
            </Link>
          </div>

          {servicePages.length > 0 && (
            <section className="mt-16">
              <h2 className="text-xl font-black text-slate-800 mb-6">
                {areaName || lp.title}で人気のサービス
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {servicePages.map((sp) => {
                  const cheapest = cheapestBookingMenu([...sp.bookingMenus, ...sp.bookingCategories.flatMap((c) => c.menus)]);
                  return (
                  <Link
                    key={sp.slug}
                    href={`/service/${sp.slug}`}
                    className="group bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl p-4 transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg leading-none flex-shrink-0" aria-hidden>
                        {sp.cardIcon || "🧹"}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 group-hover:text-blue-600 text-sm leading-snug transition-colors">
                          {sp.title}
                        </h3>
                        {sp.catchphrase && (
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                            {sp.catchphrase}
                          </p>
                        )}
                        {cheapest && (cheapest.basePrice > 0 || cheapest.priceNote) && (
                          <p className="text-[10px] font-bold text-blue-600 mt-1">
                            {cheapest.priceNote && <span className="mr-0.5">{cheapest.priceNote}</span>}
                            {cheapest.basePrice > 0 && (
                              (cheapest.discountPercent || cheapest.webSpecialPrice != null) ? (
                                <>
                                  <span className="text-slate-400 line-through mr-1">¥{cheapest.basePrice.toLocaleString()}</span>
                                  <span className="text-red-600">¥{cheapest.effectivePrice.toLocaleString()}〜</span>
                                </>
                              ) : (
                                <>¥{cheapest.basePrice.toLocaleString()}〜</>
                              )
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}