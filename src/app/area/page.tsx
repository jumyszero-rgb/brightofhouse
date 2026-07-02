// @/src/app/area/page.tsx
import prisma from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "地域別サービス一覧",
  description:
    "札幌市全10区・江別市・北広島市・恵庭市・千歳市・石狩市・小樽市・苫小牧市など、各地域のハウスクリーニング・水回りクリーニングの対応エリアをご確認いただけます。",
  alternates: { canonical: "/area" },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AreaListPage() {
  // 地域カテゴリのLPのみを取得
  const areaLPs = await prisma.landingPage.findMany({
    where: { status: "PUBLISHED", category: "AREA" },
    orderBy: { title: "asc" },
  });

  return (
    <main className="min-h-screen bg-slate-50 py-16 px-4 text-black">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">地域別サービス一覧</h1>
          <p className="text-slate-600">お住まいの地域をクリックして詳細をご確認ください。</p>
        </div>

        {areaLPs.length === 0 ? (
          <p className="text-center text-slate-500 py-20">現在、地域別ページの準備中です。</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {areaLPs.map((lp) => (
              <Link key={lp.id} href={`/area/${lp.slug}`} className="group bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center hover:shadow-md transition-all">
                <h2 className="text-lg font-bold text-blue-600 group-hover:underline">
                  {lp.linkTitle || lp.title} {/* linkTitleがあれば優先 */}
                </h2>
                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{lp.catchphrase}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}