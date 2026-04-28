// @/src/app/service/page.tsx
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "サービス・料金表 | 北海道ブライトオブハウス",
  description: "キッチン・浴室などの水回り清掃から、エアコンクリーニング、壁紙再生、ゴミ屋敷清掃まで。プロの技術と明瞭な料金体系で札幌市内外に対応。",
};

function getStyleClass(color: string, size: string, align: string) {
  const c = color === "default" ? "text-slate-600" : color;
  const s = size === "sm" ? "text-xs" : size === "base" ? "text-sm" : size;
  const a = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";
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

  // 複数の詳細ページに対応（1つのserviceItemIdに複数のページが紐付く）
  const servicePages = await prisma.servicePage.findMany({
    where: { status: "PUBLISHED" },
    select: { serviceItemId: true, slug: true, linkTitle: true }
  });

  const pagesMap = new Map<string, { slug: string; linkTitle: string | null }[]>();
  for (const p of servicePages) {
    if (!p.serviceItemId) continue;
    const existing = pagesMap.get(p.serviceItemId) || [];
    existing.push({ slug: p.slug, linkTitle: p.linkTitle });
    pagesMap.set(p.serviceItemId, existing);
  }

  const enrichedCategories = categories.map(cat => ({
    ...cat,
    items: cat.items.map(item => ({
      ...item,
      linkedPages: pagesMap.get(item.id) || []
    }))
  }));

  return (
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

        <nav className="mb-12 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 mb-3 text-center uppercase tracking-widest">Category Menu</p>
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

        <div className="space-y-12">
          {enrichedCategories.map((category) => (
            <section key={category.id} id={`cat-${category.id}`} className="mb-16 scroll-mt-20">
              <h2 className="text-xl font-black text-slate-800 border-l-8 border-blue-600 pl-4 mb-8">
                {category.title}
              </h2>

              <div className="space-y-4">
                {category.items.map((item) => (
                  <details key={item.id} className="group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 open:ring-2 open:ring-blue-100 open:border-blue-400">
                    <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h3 className="font-bold text-slate-800 text-base md:text-lg group-open:text-blue-600 transition-colors">
                          {item.title}
                        </h3>
                        {(item.regularPrice || item.discountPrice) && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 sm:mt-0">
                            {item.regularPrice && (
                              <span className={`${item.discountPrice ? 'text-slate-400 text-[10px] md:text-xs line-through' : 'text-blue-600 font-bold text-sm md:text-base'} inline-block whitespace-nowrap`}>
                                {item.regularPrice}
                              </span>
                            )}
                            {item.regularPrice && item.discountPrice && (
                              <span className="text-slate-400 text-[10px] md:text-xs hidden sm:inline">→</span>
                            )}
                            {item.discountPrice && (
                              <span className="text-lg md:text-xl font-bold text-red-600 inline-block whitespace-nowrap">
                                {item.discountPrice}
                              </span>
                            )}
                          </div>
                        )}
                        {item.subTitle && (
                          <p className="text-[10px] md:text-xs text-blue-600 font-medium mt-0.5">{item.subTitle}</p>
                        )}
                      </div>
                      <div className="flex items-center ml-2 flex-shrink-0">
                        <span className="text-slate-400 group-open:hidden text-xs md:text-sm whitespace-nowrap">+ 詳細</span>
                        <span className="text-slate-400 hidden group-open:inline text-xs md:text-sm whitespace-nowrap">- 閉じる</span>
                      </div>
                    </summary>

                    <div className="p-4 md:p-5 pt-0 border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-top-2 duration-200">
                      <dl className="mt-4 space-y-3">
                        {item.details.map((detail) => (
                          <div key={detail.id} className="flex justify-between items-baseline border-b border-slate-200/50 pb-2 last:border-0">
                            <dt className={`w-1/3 flex-shrink-0 ${getStyleClass(detail.labelColor, detail.labelSize, detail.labelAlign)}`}>
                              {detail.label}
                            </dt>
                            <dd className={`flex-1 ${getStyleClass(detail.valueColor, detail.valueSize, detail.valueAlign)}`}>
                              {detail.value}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
                        {item.linkedPages.map((lp, idx) => (
                          <Link
                            key={idx}
                            href={`/service/${lp.slug}`}
                            className="inline-block bg-slate-800 text-white text-base font-bold py-3 px-8 rounded-full hover:bg-slate-700 transition-colors text-center shadow-sm"
                          >
                            {lp.linkTitle || "このサービスを詳しく見る"}
                          </Link>
                        ))}
                        <Link
                          href="/contact"
                          className="inline-block bg-blue-600 text-white text-base font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-colors text-center shadow-sm"
                        >
                          お問い合わせはこちら
                        </Link>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-20 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
          <h2 className="text-2xl font-black text-slate-800 mb-4">お見積り・ご相談は無料です</h2>
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
              <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">お電話でのご相談</span>
              <a href="tel:0120792684" className="text-2xl font-black text-slate-800 tracking-widest font-mono">0120-792-684</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
