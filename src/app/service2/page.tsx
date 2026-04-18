// @/src/app/service2/page.tsx
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "サービス・料金一覧 | 北海道ブライトオブハウス",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ServicePage2() {
  const categories = await prisma.serviceCategory.findMany({
    include: { items: true },
    orderBy: { order: "asc" },
  });

  const servicePages = await prisma.servicePage.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, serviceItemId: true }
  });

  return (
    <main className="min-h-screen bg-slate-50 py-16 px-4 text-black">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-black text-slate-800 mb-4">サービス・料金</h1>
          <p className="text-slate-600">プロの技術で、見違えるほどの輝きを。</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col">
              <h2 className="text-2xl font-bold text-blue-600 mb-6 border-b-2 border-blue-50 pb-3 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                {cat.title}
              </h2>
              <ul className="space-y-4 mb-8 flex-1">
                {cat.items.map((item) => {
                  const linkedPage = servicePages.find(p => p.serviceItemId === item.id);
                  return (
                    <li key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-md">
                      <div>
                        <span className="font-bold text-slate-800">{item.title}</span>
                        <p className="text-blue-600 font-black mt-1">{item.discountPrice || item.regularPrice}</p>
                      </div>
                      <Link 
                        href={linkedPage ? `/service2/${linkedPage.slug}` : `/booking?category=${encodeURIComponent(cat.title)}`}
                        className="text-center bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-sm hover:bg-blue-700"
                      >
                        {linkedPage ? "詳細・予約 ➝" : "予約・見積へ"}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}