// @/src/app/lp/[slug]/page.tsx
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

// キャッシュを無効化し、常に最新のDB情報を反映
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

// --- SEOメタデータの動的生成 ---
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lp = await prisma.landingPage.findUnique({ 
    where: { 
      slug,
      category: "CAMPAIGN" // キャンペーンカテゴリのみ対象
    } 
  });

  if (!lp || lp.status === "DRAFT") return { title: "ページが見つかりません" };

  return {
    title: `${lp.title} | 北海道ブライトオブハウス`,
    description: lp.catchphrase || "キャンペーン情報",
    openGraph: {
      title: lp.title,
      description: lp.catchphrase || "",
      images: lp.heroImage ? [lp.heroImage] : [],
    },
  };
}

// --- ページ本体 ---
export default async function LPPage({ params }: Props) {
  const { slug } = await params;

  // データベースから「キャンペーン」カテゴリのLPのみを取得
  const lp = await prisma.landingPage.findUnique({ 
    where: { 
      slug,
      category: "CAMPAIGN" 
    } 
  });

  // データがない、または下書きの場合は404
  if (!lp || lp.status === "DRAFT") notFound();

  const phoneNumber = "0120-792-684";
  const lineUrl = "https://line.me/R/ti/p/@your_id"; // 実際の公式LINEのURLに書き換えてください

  return (
    <main className="min-h-screen bg-slate-50 pb-20 text-black">
      {/* 戻るナビゲーション */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <span>←</span> 公式サイト
          </Link>
          <Link href="/contact" className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm hover:bg-red-700 transition-colors">
            無料相談
          </Link>
        </div>
      </nav>

      {/* 1. ヒーローセクション */}
      <div className="relative w-full py-16 md:py-24 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 border-b-[12px] border-yellow-400">
        {lp.heroImage && (
          <Image src={lp.heroImage} alt={lp.title} fill className="object-cover opacity-40 mix-blend-overlay" priority />
        )}
        <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto w-full">
          {lp.subCopy && (
            <p className="inline-block bg-yellow-400 text-red-700 text-xs md:text-xl font-black px-5 py-2 rounded-full mb-6 shadow-lg border-2 border-white transform -rotate-1">
              {lp.subCopy}
            </p>
          )}
          <h1 className="text-3xl md:text-6xl font-black leading-tight drop-shadow-lg">
            {lp.catchphrase || lp.title}
          </h1>
        </div>
      </div>

      {/* 2. メインコンテンツエリア */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-12 border border-slate-200">
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-10 pb-6 border-b-4 border-red-500 text-center">
            {lp.title}
          </h2>

          {/* 本文 (リッチテキスト表示) */}
          {lp.content && (
            <div 
              className="ql-content prose prose-slate prose-base md:prose-xl max-w-none text-slate-700 mb-16"
              dangerouslySetInnerHTML={{ __html: lp.content }}
            />
          )}

          {/* 3. CTAエリア（電話・LINE・フォーム） */}
          <div className="bg-gradient-to-br from-red-600 to-orange-500 rounded-2xl p-6 md:p-10 text-center text-white shadow-2xl relative overflow-hidden">
            <p className="font-black text-xl md:text-2xl mb-6 text-yellow-200">
              ＼ まずはお気軽にご相談ください ／
            </p>

            {/* 電話番号セクション */}
            <div className="mb-8 bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20 max-w-2xl mx-auto">
              <p className="text-base font-bold mb-2 text-white">お急ぎの方はお電話で（9:00-18:00）</p>
              <a href={`tel:${phoneNumber.replace(/-/g, "")}`} className="flex items-center justify-center gap-3 mb-4 group transition-transform hover:scale-105">
                <span className="text-3xl md:text-4xl">📞</span>
                <span className="text-4xl md:text-6xl font-black tracking-widest font-mono text-white">{phoneNumber}</span>
              </a>
              <p className="inline-block bg-yellow-400 text-red-800 font-bold px-4 py-1.5 rounded-full text-sm md:text-base">
                ※ご相談の際は「キャンペーンページを見た」とお伝えください
              </p>
            </div>

            {/* LINE & フォームボタン */}
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
              <a 
                href={lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full md:flex-1 bg-[#06C755] text-white font-black py-4 px-6 rounded-full shadow-lg hover:brightness-110 transition-all text-lg"
              >
                <span className="text-2xl">LINE</span> で手軽に相談する
              </a>

              <Link
                href={lp.ctaLink || "/contact"}
                className="flex items-center justify-center gap-3 w-full md:flex-1 bg-yellow-400 text-red-700 font-black py-4 px-6 rounded-full shadow-lg hover:bg-yellow-500 transition-all text-lg"
              >
                お見積り依頼はこちら
              </Link>
            </div>
            
            <p className="md:hidden mt-6 text-xs font-bold opacity-90 text-white">
              ※ご相談の際「キャンペーンを見た」とお伝えください
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}