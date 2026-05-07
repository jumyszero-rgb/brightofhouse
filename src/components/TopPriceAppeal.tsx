// @/src/components/TopPriceAppeal.tsx
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function TopPriceAppeal() {
  const items = await prisma.topPriceItem.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  if (items.length === 0) return null;

  return (
    <section className="bg-gradient-to-br from-slate-800 to-slate-900 py-12 px-4 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-sky-300 text-sm font-bold mb-1">札幌最安水準の価格設定</p>
          <h2 className="text-2xl md:text-3xl font-black">単品料金のご案内</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center hover:bg-white/20 transition-colors">
              <p className="text-sm font-bold text-sky-200 mb-2">{item.title}</p>
              <p className="text-3xl md:text-4xl font-black">{item.price}</p>
              <p className="text-xs text-slate-300 mt-1">{item.unit}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-8">
          <Link href="/service" className="bg-red-600 text-white px-8 py-3 rounded-full font-black text-sm hover:bg-red-700 transition-colors shadow-lg inline-block">
            すべての料金を見る ➝
          </Link>
        </div>
      </div>
    </section>
  );
}
