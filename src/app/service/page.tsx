// @/src/app/service/page.tsx
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "サービス・料金 | 北海道ブライトオブハウス",
  description: "ハウスクリーニング、水回り清掃、遺品整理の料金一覧です。",
};

export const dynamic = "force-dynamic";

export default async function ServicePage() {
  const categories = await prisma.serviceCategory.findMany({
    include: {
      items: {
        include: { details: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  // スタイル適用ヘルパー
  const getStyleClass = (color: string, size: string, align: string) => {
    let classes = "";
    if (color === "red") classes += "text-red-600 ";
    else if (color === "blue") classes += "text-blue-600 ";
    else classes += "text-slate-700 ";

    if (size === "xs") classes += "text-xs ";
    else if (size === "sm") classes += "text-sm ";
    else if (size === "lg") classes += "text-lg font-bold ";
    else if (size === "xl") classes += "text-xl font-bold ";
    else if (size === "2xl") classes += "text-2xl font-bold ";
    else classes += "text-base ";

    if (align === "center") classes += "text-center ";
    else if (align === "right") classes += "text-right ";
    else classes += "text-left ";

    return classes;
  };

  return (
    <main className="min-h-screen bg-slate-50 py-20 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">
            サービス・料金
            <span className="block text-lg font-normal text-slate-500 mt-2">
              Service & Price
            </span>
          </h1>
          <p className="text-slate-600">
            明確な料金体系で、安心のプロの技術をご提供します。<br />
            お見積りは無料ですので、お気軽にご相談ください。
          </p>
        </div>

        {categories.map((cat) => (
          <section key={cat.id} className="mb-16">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 border-l-4 border-blue-500 pl-4 flex items-center justify-between">
              {cat.title}
            </h2>

            <div className="space-y-4">
              {cat.items.map((item) => (
                <details key={item.id} className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden open:shadow-md transition-all">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-blue-500 font-bold text-xl group-open:rotate-90 transition-transform">▶</span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-4">
                          <h3 className="text-lg font-bold text-slate-800">
                            {item.title}
                          </h3>
                          {/* ▼ 価格表示エリア */}
                          {(item.regularPrice || item.discountPrice) && (
                            <div className="flex items-baseline gap-2">
                              {item.regularPrice && (
                                <span className="text-sm text-slate-400 line-through">
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
                    </div>
                    <span className="text-slate-400 group-open:hidden text-sm whitespace-nowrap ml-2">+ 詳細</span>
                    <span className="text-slate-400 hidden group-open:inline text-sm whitespace-nowrap ml-2">- 閉じる</span>
                  </summary>

                  <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-top-2 duration-200">
                    <div className="mt-4 space-y-3">
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
                    </div>
                    
                    <div className="mt-6 text-center">
                      <Link 
                        href="/contact" 
                        className="inline-block bg-blue-600 text-white text-sm font-bold px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
                      >
                        このプランを相談する
                      </Link>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            現在、料金表を準備中です。
          </div>
        )}

        <div className="text-center mt-20">
          <p className="text-slate-600 mb-6">
            記載のないメニューや特殊な清掃についても、<br />
            まずはお気軽にご相談ください。
          </p>
          <Link
            href="/contact"
            className="inline-block bg-blue-600 text-white font-bold py-4 px-12 rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            お問い合わせ・お見積り
          </Link>
        </div>

      </div>
    </main>
  );
}