// @/src/app/company/page.tsx
// import { PrismaClient } from "@prisma/client"; // ← 削除
import prisma from "@/lib/prisma"; // ← 追加
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "会社概要 | 北海道ブライトオブハウス",
  description: "北海道ブライトハウスの会社概要・アクセス情報です。",
};

export const dynamic = "force-dynamic";

// const prisma = new PrismaClient(); // ← 削除

export default async function CompanyPage() {
  // DBから会社情報を取得
  const profile = await prisma.companyProfile.findUnique({
    where: { id: "main" },
  });

  // データがない場合のデフォルト値
  const data = profile || {
    name: "北海道ブライトオブハウス",
    representative: "（未登録）",
    address: "（未登録）",
    tel: "（未登録）",
    businessContent: "ハウスクリーニング全般",
    businessHours: "9:00 〜 18:00",
    mapCode: null,
  };

  return (
    <main className="min-h-screen bg-slate-50 py-20 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">
            会社概要
            <span className="block text-lg font-normal text-slate-500 mt-2">
              Company Profile
            </span>
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-12">
          <dl className="divide-y divide-slate-100">
            <div className="flex flex-col sm:flex-row p-6 hover:bg-slate-50 transition-colors">
              <dt className="sm:w-40 font-bold text-slate-700 mb-2 sm:mb-0 flex-shrink-0">会社名</dt>
              <dd className="text-slate-600">{data.name}</dd>
            </div>
            <div className="flex flex-col sm:flex-row p-6 hover:bg-slate-50 transition-colors">
              <dt className="sm:w-40 font-bold text-slate-700 mb-2 sm:mb-0 flex-shrink-0">代表者</dt>
              <dd className="text-slate-600">{data.representative}</dd>
            </div>
            <div className="flex flex-col sm:flex-row p-6 hover:bg-slate-50 transition-colors">
              <dt className="sm:w-40 font-bold text-slate-700 mb-2 sm:mb-0 flex-shrink-0">所在地</dt>
              <dd className="text-slate-600 whitespace-pre-wrap">{data.address}</dd>
            </div>
            <div className="flex flex-col sm:flex-row p-6 hover:bg-slate-50 transition-colors">
              <dt className="sm:w-40 font-bold text-slate-700 mb-2 sm:mb-0 flex-shrink-0">電話番号</dt>
              <dd className="text-slate-600">{data.tel}</dd>
            </div>
            <div className="flex flex-col sm:flex-row p-6 hover:bg-slate-50 transition-colors">
              <dt className="sm:w-40 font-bold text-slate-700 mb-2 sm:mb-0 flex-shrink-0">事業内容</dt>
              <dd className="text-slate-600 whitespace-pre-wrap">{data.businessContent}</dd>
            </div>
            <div className="flex flex-col sm:flex-row p-6 hover:bg-slate-50 transition-colors">
              <dt className="sm:w-40 font-bold text-slate-700 mb-2 sm:mb-0 flex-shrink-0">営業時間</dt>
              <dd className="text-slate-600">{data.businessHours}</dd>
            </div>
          </dl>
        </div>

        {/* マップ表示エリア */}
        {data.mapCode && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-2">
            <div 
              className="relative w-full h-64 sm:h-96 bg-slate-200 rounded-xl overflow-hidden [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:absolute [&>iframe]:inset-0"
              dangerouslySetInnerHTML={{ __html: data.mapCode }}
            />
          </div>
        )}
      </div>
    </main>
  );
}