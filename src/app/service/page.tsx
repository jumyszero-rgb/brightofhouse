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

  // 各ServiceItemに関連するServicePageのslugを取得するためのMapを作成
  const servicePages = await prisma.servicePage.findMany({
    select: { serviceItemId: true, slug: true }
  });
  const slugMap = new Map(servicePages.map(p => [p.serviceItemId, p.slug]));

  const enrichedCategories = categories.map(cat => ({
    ...cat,
    items: cat.items.map(item => ({
      ...item,
      pageSlug: slugMap.get(item.id) || null
    }))
  }));

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 text-black">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
            サービス・料金表
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
            お客様のご要望に合わせた多彩な清掃プランをご用意しております。
            明瞭な価格設定で、高品質なサービスを提供いたします。
          </p>
        </header>

        <div className="space-y-12">
          {enrichedCategories.map((category) => (
            <section key={category.id} className="mb-16">
              <h2 className="text-xl font-black text-slate-800 border-l-8 border-blue-600 pl-4 mb-8">
                {category.title}
              </h2>
              
              <div className="space-y-4">
                {category.items.map((item) => (
                  <details key={item.id} className="group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 open:ring-2 open:ring-blue-100 open:border-blue-400">
                    <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-slate-800 text-lg group-open:text-blue-600 transition-colors">
                            {item.title}
                          </h3>
                          {(item.regularPrice || item.discountPrice) && (
                            <div className="flex items-center gap-2">
                              {item.regularPrice && (
                                <span className={`${item.discountPrice ? 'text-slate-400 text-xs line-through' : 'text-blue-600 font-bold'}`}>
                                  {item.regularPrice}
                                </span>
                              )}
                              {item.regularPrice && item.discountPrice && (
                                <span className="text-slate-400 text-xs">→</span>
                              )}
                              {item.discountPrice && (
                                <span className="text-xl font-bold text-red-600">
                                  {item.discountPrice}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {item.subTitle && (
                          <p className="text-xs text-blue-600 font-medium mt-0.5">{item.subTitle}</p>
                        )}
                      </div>
                      <span className="text-slate-400 group-open:hidden text-sm whitespace-nowrap ml-2">+ 詳細</span>
                      <span className="text-slate-400 hidden group-open:inline text-sm whitespace-nowrap ml-2">- 閉じる</span>
                    </summary>

                    <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-top-2 duration-200">
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
                      
                      <div className="mt-6 flex flex-wrap justify-center gap-4">
                        {/* ▼ 詳細ページへのリンクボタンを追加 */}
                        {item.pageSlug && (
                          <Link 
                            href={`/service/${item.pageSlug}`} 
                            className="inline-block bg-slate-800 text-white text-sm font-bold px-6 py-2 rounded-full hover:bg-slate-700 transition-colors"
                          >
                            このサービスを詳しく見る
                          </Link>
                        )}
                        <Link 
                          href="/contact" 
                          className="inline-block bg-blue-600 text-white text-sm font-bold px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
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

        {/* 下部の共通案内セクション */}
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