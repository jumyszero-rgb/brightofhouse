// @/src/app/service/page.tsx
// サービス一覧は予約マスター（BookingCategory→BookingMenu）を唯一のソースとして表示する。
// 価格はカレンダー（予約フォーム）と同じ値なのでズレない。
// 大分類＝見出し（任意で「〇〇円〜」）、中分類＝アイキャッチ画像カード（画像の上に商品名＋通常価格→WEB特価）。
// showOnServiceList にチェックが入った中分類のみ表示。クリックで連動する詳細ページ（detailPageSlug）へ。
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { resolvePrice } from "@/lib/bookingMenuToBookingData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "サービス・料金表",
  description:
    "水回りクリーニング、キッチン・浴室・トイレ・換気扇の清掃、排水管高圧洗浄、ハウスクリーニング、ゴミ屋敷清掃まで。札幌市を中心に明朗価格で対応。",
  alternates: { canonical: "/service" },
};

const ACCENTS = ["#0e7ad1", "#12b5a6", "#e5860b", "#7c5cff", "#16a34a", "#e0575b"];

export default async function ServicePage() {
  const categoriesRaw = await prisma.bookingCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      menus: {
        where: { showOnServiceList: true },
        orderBy: { order: "asc" },
      },
    },
  });
  // 表示対象の中分類が1つ以上ある大分類だけ出す
  const categories = categoriesRaw.filter((c) => c.menus.length > 0);

  // 対応エリア（内部リンク）
  const areaPages = await prisma.landingPage.findMany({
    where: { status: "PUBLISHED", category: "AREA" },
    orderBy: { title: "asc" },
    select: { slug: true, linkTitle: true, title: true },
  });

  const heroRow = await prisma.pageHero.findUnique({ where: { key: "service" } }).catch(() => null);
  const heroImage = heroRow?.imageUrl || null;

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "ハウスクリーニング",
    provider: { "@type": "LocalBusiness", name: "北海道ブライトオブハウス", url: "https://brightofhouse.jp", telephone: "0120-792-684" },
    areaServed: { "@type": "City", name: "札幌市" },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "トップ", item: "https://brightofhouse.jp" },
      { "@type": "ListItem", position: 2, name: "サービス・料金表", item: "https://brightofhouse.jp/service" },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main className="min-h-screen bg-white text-[#0f1e2e]">
        {/* ===== ヒーロー ===== */}
        <header className="relative overflow-hidden bg-gradient-to-br from-[#0a568f] via-[#0e7ad1] to-[#12b5a6] text-white">
          {heroImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#081e32]/85 via-[#0a568f]/70 to-[#12b5a6]/50" aria-hidden />
            </>
          )}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,.5) 0, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,.35) 0, transparent 45%)" }} aria-hidden />
          <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-16 md:pt-20 md:pb-20 text-center">
            <p className="text-xs md:text-sm font-bold tracking-[.2em] text-white/80 mb-3">SERVICE &amp; PRICE</p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-sm">サービス・料金表</h1>
            <p className="mt-5 text-sm md:text-base text-white/90 leading-relaxed max-w-2xl mx-auto">
              お客様のご要望に合わせた多彩な清掃プランをご用意。
              <br className="hidden md:block" />
              明朗価格・追加料金なしで、プロの技術をお届けします。
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="bg-[#f5a524] text-[#3a2a02] font-black py-3 px-8 rounded-full shadow-lg hover:brightness-105 transition-all">無料で相談・見積り</Link>
              <a href="tel:0120792684" className="bg-white/15 backdrop-blur-sm border border-white/40 text-white font-bold py-3 px-8 rounded-full hover:bg-white/25 transition-all">📞 0120-792-684</a>
            </div>
          </div>
          <div className="relative h-6 bg-white rounded-t-[28px] -mb-px" aria-hidden />
        </header>

        <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
          {/* パンくず */}
          <nav className="text-xs text-slate-400 mb-8" aria-label="パンくず">
            <Link href="/" className="hover:text-blue-600">トップ</Link>
            <span className="mx-1.5">›</span>
            <span className="text-slate-600 font-medium">サービス・料金表</span>
          </nav>

          {/* カテゴリメニュー（ジャンプ） */}
          {categories.length > 0 && (
            <nav className="mb-12 bg-[#f4f8fb] p-5 rounded-2xl border border-[#e7ecf1]">
              <p className="text-[11px] font-bold text-slate-400 mb-3 text-center uppercase tracking-widest">Category Menu</p>
              <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                {categories.map((category, i) => {
                  const accent = ACCENTS[i % ACCENTS.length];
                  return (
                    <a key={`nav-${category.id}`} href={`#cat-${category.id}`} className="bg-white border border-[#e7ecf1] text-slate-700 text-xs md:text-sm font-bold py-2 px-4 rounded-full hover:border-[#0e7ad1] hover:text-[#0e7ad1] transition-all shadow-sm">
                      <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: accent }} />
                      {category.title}
                    </a>
                  );
                })}
              </div>
            </nav>
          )}

          {/* 大分類＝見出し / 中分類＝画像カード */}
          <div className="space-y-14">
            {categories.map((category, i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              return (
                <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-24">
                  <div className="flex items-baseline gap-3 mb-5 border-b-2 pb-2" style={{ borderColor: accent }}>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800">{category.title}</h2>
                    {category.listPriceNote && (
                      <span className="text-sm md:text-base font-black" style={{ color: accent }}>{category.listPriceNote}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {category.menus.map((menu) => {
                      const { price, originalPrice } = resolvePrice(menu.basePrice, menu.webSpecialPrice, menu.discountPercent, menu.discountRounding);
                      const href = menu.detailPageSlug ? `/service/${menu.detailPageSlug}` : "/contact";
                      return (
                        <Link key={menu.id} href={href} className="group relative block aspect-square rounded-2xl overflow-hidden shadow-sm border border-[#e7ecf1]">
                          {menu.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={menu.imageUrl} alt={menu.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-5xl" style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}44)` }}>🧹</div>
                          )}
                          {/* 文字を重ねる黒グラデーション */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5" />
                          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white">
                            <h3 className="text-sm md:text-base font-bold leading-snug line-clamp-2 drop-shadow">{menu.title}</h3>
                            {price > 0 && (
                              <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                                {originalPrice != null && (
                                  <span className="text-[11px] text-white/70 line-through">通常¥{originalPrice.toLocaleString()}</span>
                                )}
                                <span className="text-lg md:text-xl font-black text-[#ffd54a]">¥{price.toLocaleString()}</span>
                                <span className="text-[10px] text-white/80">〜</span>
                              </div>
                            )}
                          </div>
                          {menu.detailPageSlug && (
                            <span className="absolute top-2 right-2 text-[10px] font-bold bg-white/90 text-slate-700 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">詳しく見る →</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
            {categories.length === 0 && (
              <p className="text-center text-slate-500 py-10">準備中です。お気軽にお問い合わせください。</p>
            )}
          </div>

          {/* 対応エリア */}
          {areaPages.length > 0 && (
            <section className="mt-20 bg-[#f4f8fb] p-8 rounded-3xl border border-[#e7ecf1]">
              <h2 className="text-xl font-black text-slate-800 mb-6 text-center">対応エリア</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {areaPages.map((area) => (
                  <Link key={area.slug} href={`/area/${area.slug}`} className="bg-white border border-[#e7ecf1] text-slate-700 text-xs md:text-sm font-medium py-2 px-4 rounded-full hover:border-[#0e7ad1] hover:text-[#0e7ad1] transition-all">
                    {area.linkTitle || area.title}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ===== CTA バンド ===== */}
        <section className="relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a568f] to-[#12b5a6]" aria-hidden />
          <div className="relative max-w-3xl mx-auto px-4 py-14 md:py-16 text-center">
            <h2 className="text-2xl md:text-3xl font-black">お見積り・ご相談は無料です</h2>
            <p className="mt-3 text-white/90 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
              清掃箇所や汚れの状況に合わせて、最適なプランをご提案。しつこい営業は一切ございません。
            </p>
            <a href="tel:0120792684" className="block mt-6 text-3xl md:text-4xl font-black tracking-wider">📞 0120-792-684</a>
            <p className="text-xs text-white/80 mt-1">受付 9:00〜18:00（年中無休）</p>
            <Link href="/contact" className="inline-block mt-6 bg-[#f5a524] text-[#3a2a02] font-black py-4 px-12 rounded-full shadow-lg hover:brightness-105 transition-all text-lg">フォームで無料見積り</Link>
          </div>
        </section>
      </main>
    </>
  );
}
