// @/src/app/service/[slug]/page.tsx
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ServicePageBooking from "@/components/booking/ServicePageBooking";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.servicePage.findFirst({ where: { slug } });

  if (!page || page.status === "DRAFT") return { title: "ページが見つかりません" };

    // セットページは本体ページに評価集約
  const SET_PAGES = [
    "water-area-cleaning-special-set",
    "water-area-cleaning-3set-campaign",
    "water-area-cleaning-4-set",
    "water-area-cleaning-5-piece-set",
  ];

  const canonicalUrl = SET_PAGES.includes(slug)
    ? "https://brightofhouse.jp/service/water-area-cleaning-sapporo"
    : `https://brightofhouse.jp/service/${slug}`;

  return {
    title: page.title,
    description: page.metaDescription || page.catchphrase || "サービス詳細情報",
    ...(page.noIndex && { robots: { index: false, follow: true } }),
    alternates: { canonical: page.canonicalUrl || `/service/${page.slug}` },

  };


}

export default async function ServiceDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "true";

  const page = isPreview
    ? await prisma.servicePage.findFirst({ where: { slug } })
    : await prisma.servicePage.findFirst({ where: { slug, status: "PUBLISHED" } });

  if (!page) notFound();

  const phoneNumber = "0120-792-684";

  return (
    <main className="min-h-screen bg-white pb-20 text-black">
      {/* プレビューバナー */}
      {isPreview && (
        <div className="bg-yellow-400 text-black text-center py-2 text-sm font-bold sticky top-0 z-50">
          ⚠ プレビュー表示中（このページは公開されていません）
        </div>
      )}

      <nav className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center">
          <Link href="/service" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
            <span>←</span> サービス一覧に戻る
          </Link>
        </div>
      </nav>

      <div className="relative w-full py-16 md:py-24 bg-slate-900 text-white flex items-center justify-center overflow-hidden">
        {page.heroImage && (
          <Image src={page.heroImage} alt={page.title} fill className="object-cover opacity-40" priority />
        )}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-black mb-4 drop-shadow-md">{page.title}</h1>
          {page.catchphrase && (
            <p className="text-lg md:text-xl opacity-90 drop-shadow-sm font-medium mb-8">{page.catchphrase}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="#booking" className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-700 transition-all w-64">
              仮予約・お見積り
            </Link>
            <Link href="#booking" className="bg-white/20 backdrop-blur-sm text-white border border-white/50 font-bold py-3 px-8 rounded-full hover:bg-white/30 transition-all w-64">
              通常のお問い合わせはこちら
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {page.content && (
          <div className="ql-content prose prose-lg md:prose-xl max-w-none text-slate-700 leading-loose mb-20" dangerouslySetInnerHTML={{ __html: page.content }} />
        )}

        <div id="booking" className="mt-20 scroll-mt-20">
          {page.bookingData ? (
            <ServicePageBooking pageTitle={page.title} bookingData={page.bookingData as any} />
          ) : (
            <div className="bg-blue-50 rounded-3xl p-8 md:p-16 text-center border-2 border-blue-100 shadow-xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 text-blue-100 text-9xl font-black opacity-50">CONTACT</div>
              <h3 className="relative z-10 text-2xl md:text-4xl font-black text-slate-800 mb-6">お見積り・ご相談</h3>
              <p className="relative z-10 text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                お客様のご要望に合わせて柔軟に対応いたします。<br />まずはお気軽にお問い合わせください。
              </p>
              <div className="relative z-10 flex flex-col items-center gap-6">
                <Link href="/contact" className="inline-block bg-blue-600 text-white text-xl font-bold py-5 px-12 rounded-full shadow-lg hover:bg-blue-700 transition-all w-full md:w-auto">
                  お問い合わせはこちら ➝
                </Link>
                <div className="pt-6 border-t border-blue-200 w-full max-w-md">
                  <p className="text-xs text-slate-400 mb-1">お電話でのご相談はこちら</p>
                  <a href={`tel:${phoneNumber.replace(/-/g, "")}`} className="text-2xl font-black text-slate-700 hover:text-blue-600 transition-colors tracking-widest font-mono">
                    {phoneNumber}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
