// @/src/app/service/page.tsx
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import CollapsibleSection from "@/components/CollapsibleSection";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "サービス・料金表",
  description:
    "水回りクリーニング、キッチン・浴室・トイレ・換気扇の清掃、排水管高圧洗浄、エアコンクリーニング、ゴミ屋敷清掃まで。札幌市を中心に明朗価格で対応。",
  alternates: {
    canonical: "/service",
  },
};

// カテゴリごとのアクセントカラー（新トップのデザインに合わせて色分け）
const ACCENTS = [
  "#0e7ad1", // brand blue
  "#12b5a6", // teal
  "#e5860b", // amber
  "#7c5cff", // purple
  "#16a34a", // green
  "#e0575b", // red
];

function getStyleClass(color: string, size: string, align: string) {
  const c = color === "default" ? "text-slate-600" : color;
  const s =
    size === "sm" ? "text-xs" : size === "base" ? "text-sm" : size;
  const a =
    align === "left"
      ? "text-left"
      : align === "right"
        ? "text-right"
        : "text-center";
  return `${c} ${s} ${a}`;
}

export default async function ServicePage() {
  const categories = await prisma.serviceCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          details: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  const servicePages = await prisma.servicePage.findMany({
    where: { status: "PUBLISHED" },
    select: { serviceItemId: true, slug: true, linkTitle: true },
  });

  const pagesMap = new Map<
    string,
    { slug: string; linkTitle: string | null }[]
  >();
  for (const p of servicePages) {
    if (!p.serviceItemId) continue;
    const existing = pagesMap.get(p.serviceItemId) || [];
    existing.push({ slug: p.slug, linkTitle: p.linkTitle });
    pagesMap.set(p.serviceItemId, existing);
  }

  const enrichedCategories = categories.map((cat) => ({
    ...cat,
    items: cat.items.map((item) => ({
      ...item,
      linkedPages: pagesMap.get(item.id) || [],
    })),
  }));

  // ★ エリアページ取得（内部リンク用）
  const areaPages = await prisma.landingPage.findMany({
    where: { status: "PUBLISHED", category: "AREA" },
    orderBy: { title: "asc" },
    select: { slug: true, linkTitle: true, title: true },
  });

  // ★ 構造化データ: Service
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "ハウスクリーニング",
    provider: {
      "@type": "LocalBusiness",
      name: "北海道ブライトオブハウス",
      url: "https://brightofhouse.jp",
      telephone: "0120-792-684",
    },
    areaServed: {
      "@type": "City",
      name: "札幌市",
    },
  };

  // ★ 構造化データ: BreadcrumbList
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="min-h-screen bg-white text-[#0f1e2e]">
        {/* ===== ヒーロー ===== */}
        <header className="relative overflow-hidden bg-gradient-to-br from-[#0a568f] via-[#0e7ad1] to-[#12b5a6] text-white">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,.5) 0, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,.35) 0, transparent 45%)",
            }}
            aria-hidden
          />
          <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-16 md:pt-20 md:pb-20 text-center">
            <p className="text-xs md:text-sm font-bold tracking-[.2em] text-white/80 mb-3">
              SERVICE &amp; PRICE
            </p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-sm">
              サービス・料金表
            </h1>
            <p className="mt-5 text-sm md:text-base text-white/90 leading-relaxed max-w-2xl mx-auto">
              お客様のご要望に合わせた多彩な清掃プランをご用意。
              <br className="hidden md:block" />
              明朗価格・追加料金なしで、プロの技術をお届けします。
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/contact"
                className="bg-[#f5a524] text-[#3a2a02] font-black py-3 px-8 rounded-full shadow-lg hover:brightness-105 transition-all"
              >
                無料で相談・見積り
              </Link>
              <a
                href="tel:0120792684"
                className="bg-white/15 backdrop-blur-sm border border-white/40 text-white font-bold py-3 px-8 rounded-full hover:bg-white/25 transition-all"
              >
                📞 0120-792-684
              </a>
            </div>
          </div>
          {/* 下端のなだらかな仕切り */}
          <div className="relative h-6 bg-white rounded-t-[28px] -mb-px" aria-hidden />
        </header>

        <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
          {/* パンくず */}
          <nav className="text-xs text-slate-400 mb-8" aria-label="パンくず">
            <Link href="/" className="hover:text-blue-600">トップ</Link>
            <span className="mx-1.5">›</span>
            <span className="text-slate-600 font-medium">サービス・料金表</span>
          </nav>

          {/* カテゴリメニュー */}
          <nav className="mb-14 bg-[#f4f8fb] p-5 rounded-2xl border border-[#e7ecf1]">
            <p className="text-[11px] font-bold text-slate-400 mb-3 text-center uppercase tracking-widest">
              Category Menu
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {enrichedCategories.map((category, i) => {
                const accent = ACCENTS[i % ACCENTS.length];
                return (
                  <a
                    key={`nav-${category.id}`}
                    href={`#cat-${category.id}`}
                    className="bg-white border border-[#e7ecf1] text-slate-700 text-xs md:text-sm font-bold py-2 px-4 rounded-full hover:border-[#0e7ad1] hover:text-[#0e7ad1] transition-all shadow-sm"
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                      style={{ background: accent }}
                    />
                    {category.title}
                  </a>
                );
              })}
            </div>
          </nav>

          {/* カテゴリ別 サービスカード（カテゴリごとに開閉） */}
          <div className="space-y-3">
            {enrichedCategories.map((category, i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              return (
                <CollapsibleSection
                  key={category.id}
                  anchorId={`cat-${category.id}`}
                  title={category.title}
                  accent={accent}
                  count={category.items.length}
                >
                  <div className="space-y-6">
                    {category.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-[#e7ecf1] shadow-[0_8px_24px_rgba(15,30,46,.06)] overflow-hidden"
                      >
                        {/* アクセントの上帯 */}
                        <div className="h-1.5" style={{ background: accent }} />
                        <div className="p-5 md:p-6">
                          <div className="mb-4">
                            <h3 className="font-bold text-slate-800 text-base md:text-lg">
                              {item.title}
                            </h3>
                            {item.subTitle && (
                              <p
                                className="text-xs font-medium mt-0.5"
                                style={{ color: accent }}
                              >
                                {item.subTitle}
                              </p>
                            )}
                            {(item.regularPrice || item.discountPrice) && (
                              <div className="flex items-center gap-3 mt-2">
                                {item.regularPrice && item.discountPrice && (
                                  <span className="text-slate-400 text-xs line-through">
                                    {item.regularPrice}
                                  </span>
                                )}
                                <span className="text-xl md:text-2xl font-black text-red-600">
                                  {item.discountPrice || item.regularPrice}
                                </span>
                              </div>
                            )}
                          </div>

                          {item.details.length > 0 && (
                            <dl className="bg-[#f4f8fb] rounded-xl p-4 space-y-2">
                              {item.details.map((detail) => (
                                <div
                                  key={detail.id}
                                  className="flex justify-between items-baseline border-b border-slate-200/60 pb-2 last:border-0 last:pb-0"
                                >
                                  <dt
                                    className={`w-1/3 flex-shrink-0 ${getStyleClass(
                                      detail.labelColor,
                                      detail.labelSize,
                                      detail.labelAlign
                                    )}`}
                                  >
                                    {detail.label}
                                  </dt>
                                  <dd
                                    className={`flex-1 ${getStyleClass(
                                      detail.valueColor,
                                      detail.valueSize,
                                      detail.valueAlign
                                    )}`}
                                  >
                                    {detail.value}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          )}

                          {/* 詳細ページあり → 詳細ボタン / なし → お問い合わせボタン */}
                          <div className="mt-5 flex flex-wrap justify-end gap-3">
                            {item.linkedPages.length > 0 ? (
                              item.linkedPages.slice(0, 5).map((lp, idx) => (
                                <Link
                                  key={idx}
                                  href={`/service/${lp.slug}`}
                                  className="inline-flex items-center gap-1 text-white text-sm md:text-base font-bold py-3 px-8 rounded-full transition-all shadow-sm hover:brightness-110"
                                  style={{ background: accent }}
                                >
                                  {lp.linkTitle || "詳しく見る"}
                                  <span aria-hidden>→</span>
                                </Link>
                              ))
                            ) : (
                              <Link
                                href="/contact"
                                className="inline-flex items-center gap-1 bg-[#0e7ad1] text-white text-sm md:text-base font-bold py-3 px-8 rounded-full hover:bg-[#0a568f] transition-colors text-center shadow-sm"
                              >
                                お問い合わせ
                                <span aria-hidden>→</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              );
            })}
          </div>

          {/* 対応エリアリンク（内部リンク網の強化） */}
          {areaPages.length > 0 && (
            <section className="mt-20 bg-[#f4f8fb] p-8 rounded-3xl border border-[#e7ecf1]">
              <h2 className="text-xl font-black text-slate-800 mb-6 text-center">
                対応エリア
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {areaPages.map((area) => (
                  <Link
                    key={area.slug}
                    href={`/area/${area.slug}`}
                    className="bg-white border border-[#e7ecf1] text-slate-700 text-xs md:text-sm font-medium py-2 px-4 rounded-full hover:border-[#0e7ad1] hover:text-[#0e7ad1] transition-all"
                  >
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
            <h2 className="text-2xl md:text-3xl font-black">
              お見積り・ご相談は無料です
            </h2>
            <p className="mt-3 text-white/90 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
              清掃箇所や汚れの状況に合わせて、最適なプランをご提案。
              しつこい営業は一切ございません。
            </p>
            <a href="tel:0120792684" className="block mt-6 text-3xl md:text-4xl font-black tracking-wider">
              📞 0120-792-684
            </a>
            <p className="text-xs text-white/80 mt-1">受付 9:00〜18:00（年中無休）</p>
            <Link
              href="/contact"
              className="inline-block mt-6 bg-[#f5a524] text-[#3a2a02] font-black py-4 px-12 rounded-full shadow-lg hover:brightness-105 transition-all text-lg"
            >
              フォームで無料見積り
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
