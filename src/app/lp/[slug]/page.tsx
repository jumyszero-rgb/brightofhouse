// @/src/app/lp/[slug]/page.tsx
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

// ▼ 追加: キャッシュを無効化し、常に最新のDB情報を反映させる
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lp = await prisma.landingPage.findUnique({ where: { slug } });
  if (!lp || lp.status === "DRAFT") return { title: "ページが見つかりません" };
  return {
    title: `${lp.title} | 北海道ブライトオブハウス`,
    description: lp.catchphrase || "キャンペーン情報",
  };
}

export default async function LPPage({ params }: Props) {
  const { slug } = await params;
  const lp = await prisma.landingPage.findUnique({ where: { slug } });

  // データがない、または下書きの場合は404
  if (!lp || lp.status === "DRAFT") notFound();

  const phoneNumber = "0120-792-684";

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

      {/* ヒーローエリア */}
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

      {/* 本文エリア */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-12 border border-slate-200">
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-10 pb-6 border-b-4 border-red-500 text-center">
            {lp.title}
          </h2>

          {/* 本文 (リッチテキスト表示) */}
          {lp.content && (
            <div 
              className="ql-content prose prose-lg md:prose-xl max-w-none text-slate-700 mb-16"
              dangerouslySetInnerHTML={{ __html: lp.content }}
            />
          )}

          {/* CTAエリア */}
          <div className="bg-gradient-to-br from-red-600 to-orange-500 rounded-2xl p-6 md:p-10 text-center text-white shadow-2xl relative overflow-hidden">
            <p className="font-black text-xl md:text-2xl mb-6 text-yellow-200">
              ＼ まずはお気軽にご相談ください ／
            </p>

            <div className="hidden md:block mb-8 bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20">
              <p className="text-base font-bold mb-2 text-white">お急ぎの方はお電話で（9:00-18:00）</p>
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-3xl">📞</span>
                <span className="text-5xl font-black tracking-widest font-mono text-white">{phoneNumber}</span>
              </div>
              <p className="inline-block bg-yellow-400 text-red-800 font-bold px-4 py-1.5 rounded-full text-base">
                ※ご相談の際は「キャンペーンページを見た」とお伝えください
              </p>
            </div>

            <Link
              href={lp.ctaLink || "/contact"}
              className="inline-block w-full md:w-auto bg-yellow-400 text-red-700 text-lg md:text-2xl font-black py-4 px-12 rounded-full shadow-[0_6px_0_rgb(185,28,28)] hover:shadow-[0_2px_0_rgb(185,28,28)] hover:translate-y-1 transition-all"
            >
              {lp.ctaText || "無料お見積りはこちら"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}