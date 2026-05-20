// @/src/app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!post || post.status === "DRAFT") return { title: "記事が見つかりません" };

  return {
    title: post.title,
    description: post.metaDescription || post.title,
    ...(post.noIndex && { robots: { index: false, follow: true } }),
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.metaDescription || "",
      type: "article",
      url: `https://brightofhouse.jp/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: { category: true },
  });

  if (!post) notFound();

  // 関連記事：同カテゴリの記事を最大6件取得（自分自身を除く）
  let relatedPosts: any[] = [];
  if (post.categoryId) {
    relatedPosts = await prisma.blogPost.findMany({
      where: {
        categoryId: post.categoryId,
        status: "PUBLISHED",
        id: { not: post.id },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, slug: true, title: true, createdAt: true, content: true },
    });
  }

  // 関連記事が足りない場合は最新記事で補完
  if (relatedPosts.length < 6) {
    const existingIds = [post.id, ...relatedPosts.map(p => p.id)];
    const more = await prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        id: { notIn: existingIds },
      },
      orderBy: { createdAt: "desc" },
      take: 6 - relatedPosts.length,
      select: { id: true, slug: true, title: true, createdAt: true, content: true },
    });
    relatedPosts = [...relatedPosts, ...more];
  }

  return (
    <main className="min-h-screen bg-white pb-20 text-black">
      {/* ナビゲーション */}
      <div className="bg-slate-50 border-b border-slate-200 pt-10 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" className="text-sm text-blue-600 hover:underline mb-6 inline-block font-bold transition-colors">
            ← お掃除ブログ一覧へ戻る
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <time className="text-slate-500 text-sm font-medium bg-white px-3 py-1 rounded-full border border-slate-200">
              {new Date(post.createdAt).toLocaleDateString("ja-JP")}
            </time>
            {post.category && (
              <Link
                href={`/blog?category=${post.category.slug}`}
                className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200 transition-colors"
              >
                {post.category.name}
              </Link>
            )}
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight">
            {post.title}
          </h1>
        </div>
      </div>

      {/* 記事本文 */}
      <article className="max-w-3xl mx-auto px-4 py-12">
        <div
          className="ql-content prose prose-slate prose-base md:prose-lg max-w-none text-slate-700 leading-loose"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA */}
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

        {/* 関連記事 */}
        {relatedPosts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              📖 関連記事
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.slug}`}
                  className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="p-5">
                    <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded mb-3 inline-block">
                      {new Date(rp.createdAt).toLocaleDateString("ja-JP")}
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                      {rp.title}
                    </h3>
                    <div
                      className="text-slate-500 text-xs line-clamp-2 opacity-80"
                      dangerouslySetInnerHTML={{ __html: rp.content.replace(/<[^>]*>?/gm, "").substring(0, 80) }}
                    />
                    <span className="text-blue-600 text-xs font-bold mt-2 inline-block group-hover:underline">
                      続きを読む →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
