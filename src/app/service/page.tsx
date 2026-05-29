// @/src/app/service/page.tsx
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      <main className="min-h-screen bg-slate-50 py-12 px-4 text-black">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              サービス・料金表
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
              お客様のご要望に合わせた多彩な清掃プランをご用意しております。
              明朗価格で、高品質なサービスを提供いたします。
            </p>
          </header>

          {/* カテゴリメニュー */}
          <nav className="mb-12 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 mb-3 text-center uppercase tracking-widest">
              Category Menu
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {enrichedCategories.map((category) => (
                <a
                  key={`nav-${category.id}`}
                  href={`#cat-${category.id}`}
                  className="bg-white border border-slate-200 text-slate-700 text-xs md:text-sm font-bold py-2 px-4 rounded-full hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                >
                  {category.title}
                </a>
              ))}
            </div>
          </nav>

          {/* ★ 変更: details → カード形式で料金を常に表示 */}
          <div className="space-y-16">
            {enrichedCategories.map((category) => (
              <section
                key={category.id}
                id={`cat-${category.id}`}
                className="scroll-mt-20"
              >
                <h2 className="text-xl font-black text-slate-800 border-l-8 border-blue-600 pl-4 mb-8">
                  {category.title}
                </h2>

                <div className="space-y-6">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      {/* ヘッダー: サービス名 + 価格 */}
                      <div className="p-5 md:p-6">
                        <div className="mb-4">
                          <h3 className="font-bold text-slate-800 text-base md:text-lg">
                            {item.title}
                          </h3>
                          {item.subTitle && (
                            <p className="text-xs text-blue-600 font-medium mt-0.5">
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

                        {/* ★ 変更: 料金詳細を常に表示（detailsタグ廃止） */}
                        {item.details.length > 0 && (
                          <dl className="bg-slate-50/80 rounded-lg p-4 space-y-2">
                            {item.details.map((detail) => (
                              <div
                                key={detail.id}
                                className="flex justify-between items-baseline border-b border-slate-200/50 pb-2 last:border-0 last:pb-0"
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
                                className="inline-block bg-slate-800 text-white text-sm md:text-base font-bold py-3 px-8 rounded-full hover:bg-slate-700 transition-colors text-center shadow-sm"
                              >
                                {lp.linkTitle || "詳しく見る"}
                              </Link>
                            ))
                          ) : (
                            <Link
                              href="/contact"
                              className="inline-block bg-blue-600 text-white text-sm md:text-base font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-colors text-center shadow-sm"
                            >
                              お問い合わせ
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* ★ 追加: 対応エリアリンク（内部リンク網の強化） */}
          {areaPages.length > 0 && (
            <section className="mt-20 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-black text-slate-800 mb-6 text-center">
                対応エリア
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {areaPages.map((area) => (
                  <Link
                    key={area.slug}
                    href={`/area/${area.slug}`}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs md:text-sm font-medium py-2 px-4 rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    {area.linkTitle || area.title}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="mt-12 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
            <h2 className="text-2xl font-black text-slate-800 mb-4">
              お見積り・ご相談は無料です
            </h2>
            <p className="text-slate-500 mb-8 max-w-lg mx-auto">
              清掃箇所や汚れの状況に合わせて、最適なプランをご提案いたします。
              しつこい営業などは一切ございませんので、お気軽にご連絡ください。
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <Link
                href="/contact"
                className="w-full md:w-auto bg-blue-600 text-white font-bold py-4 px-12 rounded-full shadow-lg hover:bg-blue-700 transition-all text-lg"
              >
                無料お見積りはこちら
              </Link>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                  お電話でのご相談
                </span>
                <a
                  href="tel:0120792684"
                  className="text-2xl font-black text-slate-800 tracking-widest font-mono"
                >
                  0120-792-684
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
