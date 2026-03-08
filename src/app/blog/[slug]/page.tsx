// @/src/app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || post.status === "DRAFT") return { title: "記事が見つかりません" };

  return {
    title: `${post.title} | 北海道ブライトオブハウス`,
    description: post.title,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug, status: "PUBLISHED" } });

  if (!post) notFound();

  return (
    <main className="min-h-screen bg-white pb-20 text-black">
      {/* 記事ヘッダー */}
      <div className="bg-slate-50 border-b border-slate-200 pt-10 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
            ← ブログ一覧へ戻る
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <time className="text-slate-500 text-sm font-medium">
              {new Date(post.createdAt).toLocaleDateString()}
            </time>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight">
            {post.title}
          </h1>
        </div>
      </div>

      {/* 記事本文 */}
      <article className="max-w-3xl mx-auto px-4 py-12">
        <div 
          className="ql-content prose prose-slate prose-base md:prose-lg max-w-none text-slate-700"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* シェア・CTA */}
        <div className="mt-20 p-8 bg-blue-50 rounded-2xl border border-blue-100 text-center">
          <h3 className="text-xl font-bold text-slate-800 mb-4">お困りごとはプロにご相談ください</h3>
          <p className="text-slate-600 mb-6 text-sm">
            お見積りは無料です。札幌市近郊どこでも駆けつけます！
          </p>
          <Link href="/contact" className="inline-block bg-blue-600 text-white font-bold py-3 px-10 rounded-full hover:bg-blue-700 transition-colors">
            無料相談・お問い合わせ
          </Link>
        </div>
      </article>
    </main>
  );
}