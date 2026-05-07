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
    <section className="bg-white py-12 px-4 text-black border-b border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-slate-500 text-sm font-bold mb-1">札幌最安水準の価格設定</p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800">単品料金のご案内</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-100 transition-colors">
              <p className="text-sm font-bold text-slate-600 mb-2">{item.title}</p>
              <p className="text-3xl md:text-4xl font-black text-slate-800">{item.price}</p>
              <p className="text-xs text-slate-400 mt-1">{item.unit}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/service" className="bg-red-600 text-white px-10 py-4 rounded-full font-black text-base hover:bg-red-700 transition-colors shadow-lg inline-block">
            すべての料金を見る ➝
          </Link>
        </div>
      </div>
    </section>
  );
}
