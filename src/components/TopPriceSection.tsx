// @/src/components/TopPriceSection.tsx
import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function TopPriceSection() {
  // DBから人気メニュー（表示順、トップページには最大3つまで）
  const menus = await prisma.serviceMenu.findMany({
    orderBy: { order: "asc" },
    take: 3,
  });

  // DBから単品料金（有効なもののみ）
  const items = await prisma.topPriceItem.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  if (menus.length === 0 && items.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">
            人気メニュー・料金
          </h2>
          <p className="text-slate-600">
            明朗会計で安心。お得なセットプランもご用意しています。
          </p>
        </div>

        {menus.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className={`relative bg-white rounded-2xl shadow-lg border p-6 flex flex-col ${
                  menu.isPopular
                    ? "border-2 border-yellow-400 transform md:-translate-y-4 shadow-xl"
                    : "border-slate-100"
                }`}
              >
                {menu.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 font-bold px-6 py-1 rounded-full shadow-sm text-sm whitespace-nowrap">
                    人気 No.1
                  </div>
                )}

                <h3 className="text-xl font-bold text-slate-800 text-center mb-2 mt-2">
                  {menu.title}
                </h3>

                <p className="text-center text-slate-500 text-sm mb-6 min-h-[40px]">
                  {menu.description}
                </p>

                <div className="text-center mb-6">
                  <div className="text-blue-600 font-bold">
                    {menu.priceNote && (
                      <span className="text-lg mr-1 text-slate-600">{menu.priceNote}</span>
                    )}
                    <span className="text-4xl mx-1">{menu.price}</span>
                    <span className="text-sm">{menu.unit}</span>
                  </div>
                </div>

                <ul className="text-sm text-slate-600 space-y-2 mb-8 bg-slate-50 p-4 rounded-lg flex-1">
                  {menu.features?.split("\n").map((feature, i) => (
                    <li key={i} className="flex items-start">
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={menu.link}
                  className={`block w-full font-bold text-center py-3 rounded-full transition-colors ${
                    menu.isPopular
                      ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-500"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  詳しく見る
                </Link>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className={menus.length > 0 ? "mt-16 pt-12 border-t border-slate-100" : ""}>
            <div className="text-center mb-8">
              <p className="text-slate-500 text-sm font-bold mb-1">札幌最安水準の価格設定</p>
              <h3 className="text-2xl font-black text-slate-800">単品料金のご案内</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-red-600 border border-red-700 rounded-2xl p-4 text-center"
                >
                  <p className="text-sm font-bold text-white mb-2">{item.title}</p>
                  <p className="text-3xl md:text-4xl font-black text-white">{item.price}</p>
                  <p className="text-xs text-white mt-1">{item.unit}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            href="/service"
            className="inline-block bg-red-600 text-white font-black px-10 py-4 rounded-full shadow-lg hover:bg-red-700 transition-colors"
          >
            すべての料金表を見る ➝
          </Link>
        </div>
      </div>
    </section>
  );
}
