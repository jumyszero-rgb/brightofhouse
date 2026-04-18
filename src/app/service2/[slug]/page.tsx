// @/src/app/service/[slug]/page.tsx
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import BookingIntegrated from "@/components/booking/BookingIntegrated";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.servicePage.findUnique({ where: { slug } });
  if (!page) return { title: "ページが見つかりません" };
  return { title: `${page.title} | 北海道ブライトオブハウス` };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  
  const page = await prisma.servicePage.findUnique({
    where: { slug, status: "PUBLISHED" }
  });

  if (!page) notFound();

  // 予約コンポーネントに渡す初期カテゴリを特定
  const masterItem = page.serviceItemId 
    ? await prisma.serviceItem.findUnique({
        where: { id: page.serviceItemId },
        include: { category: true }
      })
    : null;

  return (
    <main className="min-h-screen bg-white pb-20 text-black">
      {/* 戻るボタン */}
      <nav className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center">
          <Link href="/service" className="text-xs font-bold text-blue-600 hover:underline">
            ← サービス一覧に戻る
          </Link>
        </div>
      </nav>

      {/* 前半：詳細説明セクション */}
      <div className="relative w-full py-20 bg-slate-900 text-white overflow-hidden text-center px-4">
        {page.heroImage && (
          <Image src={page.heroImage} alt={page.title} fill className="object-cover opacity-40" priority />
        )}
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-black mb-4 drop-shadow-md">{page.title}</h1>
          <p className="text-lg md:text-xl opacity-90 font-medium">{page.catchphrase}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* 文章・作業手順（リッチテキスト） */}
        <div 
          className="ql-content prose prose-lg md:prose-xl max-w-none text-slate-700 leading-loose mb-20"
          dangerouslySetInnerHTML={{ __html: page.content || "" }}
        />

        {/* 区切り線 */}
        <hr className="border-slate-200 mb-20" />

        {/* 後半：予約システム（料金表込み）を直接埋め込み */}
        <section id="booking" className="scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">Web見積・予約</h2>
            <p className="text-slate-500 font-medium">メニューを選択すると料金と詳細が表示されます。そのまま空き状況の確認が可能です。</p>
          </div>
          
          <Suspense fallback={<div className="py-20 text-center font-bold">予約システムを読み込み中...</div>}>
            <BookingIntegrated 
              initialCategoryId={masterItem?.categoryId} 
              initialItemId={masterItem?.id} 
            />
          </Suspense>
        </section>
      </div>
    </main>
  );
}