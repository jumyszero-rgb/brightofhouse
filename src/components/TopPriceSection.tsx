// @/src/components/TopPriceSection.tsx
import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function TopPriceSection() {
  // DBからメニューを取得（表示順）
  const menus = await prisma.serviceMenu.findMany({
    orderBy: { order: "asc" },
    take: 3, // トップページには最大3つまで
  });

  if (menus.length === 0) return null;

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
                  {/* ▼ 補足ラベル (2点, 壁掛けなど) */}
                  {menu.priceNote && (
                    <span className="text-lg mr-1 text-slate-600">{menu.priceNote}</span>
                  )}
                  <span className="text-4xl mx-1">{menu.price}</span>
                  <span className="text-sm">{menu.unit}</span>
                </div>
              </div>
              
              {/* 特徴リスト */}
              <ul className="text-sm text-slate-600 space-y-2 mb-8 bg-slate-50 p-4 rounded-lg flex-1">
                {menu.features?.split('\n').map((feature, i) => (
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
        
        <div className="text-center mt-10">
          <Link href="/service" className="text-blue-600 font-bold border-b border-blue-600 pb-1 hover:text-blue-800 hover:border-blue-800 transition-colors">
            すべての料金表を見る ➝
          </Link>
        </div>
      </div>
    </section>
  );
}