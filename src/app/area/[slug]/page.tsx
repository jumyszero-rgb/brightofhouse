// @/src/app/area/[slug]/page.tsx
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lp = await prisma.landingPage.findUnique({ 
    where: { slug, category: "AREA" } 
  });

  if (!lp || lp.status === "DRAFT") return { title: "ページが見つかりません" };

  return {
    title: `${lp.title} | 北海道ブライトオブハウス`,
    description: lp.catchphrase || `${lp.title}の清掃・片付けサービス。お見積り無料、迅速対応。`,
  };
}

export default async function AreaPage({ params }: Props) {
  const { slug } = await params;
  const lp = await prisma.landingPage.findUnique({ 
    where: { slug, category: "AREA" } 
  });

  if (!lp || lp.status === "DRAFT") notFound();

  const phoneNumber = "0120-792-684";

  return (
    <main className="min-h-screen bg-slate-50 pb-20 text-black">
      {/* 戻るナビゲーション */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <span>←</span> 公式サイトへ
          </Link>
          <div className="text-xs font-bold text-slate-400">地域限定ページ</div>
        </div>
      </nav>

      {/* ヒーローエリア */}
      <div className="relative w-full py-16 md:py-24 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-500 border-b-[12px] border-blue-100">
        {lp.heroImage && (
          <Image src={lp.heroImage} alt={lp.title} fill className="object-cover opacity-30 mix-blend-overlay" priority />
        )}
        <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto w-full">
          <h1 className="text-3xl md:text-6xl font-black leading-tight drop-shadow-lg">
            {lp.catchphrase || lp.title}
          </h1>
        </div>
      </div>

      {/* 本文エリア */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-12 border border-slate-200">
          {/* 本文 (リッチテキスト表示) */}
          {lp.content && (
            <div 
              className="ql-content prose prose-lg md:prose-xl max-w-none text-slate-700 mb-16"
              dangerouslySetInnerHTML={{ __html: lp.content }}
            />
          )}

          {/* CTAエリア */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 md:p-10 text-center text-white shadow-2xl relative overflow-hidden">
            <p className="font-black text-xl md:text-2xl mb-6 text-white">
              ＼ {lp.title}の皆様、お気軽にご相談ください ／
            </p>

            <div className="hidden md:block mb-8 bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-3xl">📞</span>
                <span className="text-5xl font-black tracking-widest font-mono text-white">{phoneNumber}</span>
              </div>
              <p className="inline-block bg-white text-blue-800 font-bold px-4 py-1.5 rounded-full text-base">
                地域担当者が迅速にお伺いいたします
              </p>
            </div>

            <Link
              href={lp.ctaLink || "/contact"}
              className="inline-block w-full md:w-auto bg-yellow-400 text-blue-900 text-lg md:text-2xl font-black py-4 px-12 rounded-full shadow-lg hover:bg-yellow-500 transition-all"
            >
              無料お見積りはこちら
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}