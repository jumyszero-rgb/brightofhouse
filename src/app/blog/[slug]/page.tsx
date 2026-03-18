// @/src/app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";

// 常に最新のDB情報を反映し、キャッシュによる表示遅延を防止
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

// --- SEOメタデータの動的生成 (DBのキーワード・説明文を反映) ---
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });

  // 記事がない、または下書きの場合はインデックスさせない
  if (!post || post.status === "DRAFT") return { title: "記事が見つかりません" };

  // カンマ区切りのキーワードを配列に変換
  const keywords = post.metaKeywords ? post.metaKeywords.split(",").map(k => k.trim()) :[];

  return {
    title: `${post.title} | 北海道ブライトオブハウス`,
    description: post.metaDescription || post.title,
    keywords: keywords, // 管理画面で設定したキーワードを適用
    alternates: {
      canonical: `/blog/${post.slug}`, // 正規URLの指定
    },
    openGraph: {
      title: post.title,
      description: post.metaDescription || "",
      type: "article",
      url: `https://brightofhouse.jp/blog/${post.slug}`,
    },
  };
}

// --- ページ本体 ---
export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  
  // 公開中の記事のみを取得
  const post = await prisma.blogPost.findUnique({ 
    where: { slug, status: "PUBLISHED" } 
  });

  if (!post) notFound();

  return (
    <main className="min-h-screen bg-white pb-20 text-black">
      
      {/* 1. 記事用ナビゲーション */}
      <div className="bg-slate-50 border-b border-slate-200 pt-10 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" className="text-sm text-blue-600 hover:underline mb-6 inline-block font-bold transition-colors">
            ← お掃除ブログ一覧へ戻る
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <time className="text-slate-500 text-sm font-medium bg-white px-3 py-1 rounded-full border border-slate-200">
              {new Date(post.createdAt).toLocaleDateString("ja-JP")}
            </time>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight">
            {post.title}
          </h1>
        </div>
      </div>

      {/* 2. 記事本文エリア */}
      <article className="max-w-3xl mx-auto px-4 py-12">
        {/* 本文 (リッチテキスト表示・globals.cssのスタイル適用) */}
        <div 
          className="ql-content prose prose-slate prose-base md:prose-lg max-w-none text-slate-700 leading-loose"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* 3. 記事下部 CTA */}
        <div className="mt-20 p-8 bg-blue-50 rounded-2xl border border-blue-100 text-center shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-4">
            お困りごとはプロにご相談ください
          </h3>
          <p className="text-slate-600 mb-8 text-sm leading-relaxed">
            北海道ブライトオブハウスでは、お見積り無料で迅速に駆けつけます。<br />
            まずは24時間受付中のメールまたはLINEより、お気軽にお問い合わせください。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact" 
              className="inline-block bg-blue-600 text-white font-bold py-3 px-10 rounded-full hover:bg-blue-700 transition-all shadow-md"
            >
              無料相談・お問い合わせ
            </Link>
            <Link 
              href="/service" 
              className="inline-block bg-white text-blue-600 border border-blue-200 font-bold py-3 px-10 rounded-full hover:bg-slate-50 transition-all"
            >
              料金表を確認する
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}