// @/src/app/company/page.tsx
// import { PrismaClient } from "@prisma/client"; // ← 削除
import prisma from "@/lib/prisma"; // ← 追加
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "会社概要",
  description:
    "北海道ブライトオブハウスの会社概要・所在地・営業時間などの基本情報です。札幌市を中心に水回りクリーニング・ハウスクリーニングを提供しています。",
  alternates: { canonical: "/company" },
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

  // ヒーロー背景画像（admin設定・未設定なら通常ヘッダー）
  const heroRow = await prisma.pageHero.findUnique({ where: { key: "company" } }).catch(() => null);
  const heroImage = heroRow?.imageUrl || null;

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: data.name,
    url: "https://brightofhouse.jp",
    telephone: data.tel,
    address: {
      "@type": "PostalAddress",
      addressLocality: typeof data.address === "string" ? data.address : undefined,
      addressCountry: "JP",
    },
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {heroImage ? (
        <section className="relative overflow-hidden text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#081e32]/85 via-[#0a568f]/65 to-[#12b5a6]/45" aria-hidden />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-20 text-center">
            <h1 className="text-3xl sm:text-5xl font-black drop-shadow-sm">
              会社概要
              <span className="block text-base font-medium text-white/85 mt-2 tracking-widest">Company Profile</span>
            </h1>
          </div>
        </section>
      ) : (
        <div className="text-center pt-20 pb-0 px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">
            会社概要
            <span className="block text-lg font-normal text-slate-500 mt-2">
              Company Profile
            </span>
          </h1>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16">

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
              <dd className="text-slate-600">
                {data.tel}
                <span className="block text-xs text-slate-400 mt-1.5 leading-relaxed">
                  ※恐れ入りますが、営業・勧誘を目的としたお電話はご遠慮ください。
                  サービスに関するご相談・お見積りのお客様専用のお電話となっております。
                </span>
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row p-6 hover:bg-slate-50 transition-colors">
              <dt className="sm:w-40 font-bold text-slate-700 mb-2 sm:mb-0 flex-shrink-0">事業内容</dt>
              <dd className="text-slate-600 whitespace-pre-wrap">{data.businessContent}</dd>
            </div>
            <div className="flex flex-col sm:flex-row p-6 hover:bg-slate-50 transition-colors">
              <dt className="sm:w-40 font-bold text-slate-700 mb-2 sm:mb-0 flex-shrink-0">営業時間</dt>
              <dd className="text-slate-600">{data.businessHours}</dd>
            </div>
            <div className="flex flex-col sm:flex-row p-6 hover:bg-slate-50 transition-colors">
              <dt className="sm:w-40 font-bold text-slate-700 mb-2 sm:mb-0 flex-shrink-0">運営会社サイト</dt>
              <dd className="text-slate-600">
                <a
                  href="https://musubiemu.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0e7ad1] font-medium hover:underline break-all"
                >
                  musubiemu.com
                </a>
              </dd>
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