// @/src/app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { expandShortcodes } from "@/lib/shortcodes";

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
      ...(post.thumbnail && { images: [{ url: post.thumbnail }] }),
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

  // 本文中の [[key]] ショートコードを展開
  const contentHtml = await expandShortcodes(post.content);

  // タイトル背景に使う画像：アイキャッチ(thumbnail)優先、無ければ本文の最初の画像
  const firstBodyImage = contentHtml.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || null;
  const headerBg = post.thumbnail || firstBodyImage;

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

  // 構造化データ: BlogPosting
  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Organization",
      name: "北海道ブライトオブハウス",
    },
    publisher: {
      "@type": "Organization",
      name: "北海道ブライトオブハウス",
      logo: {
        "@type": "ImageObject",
        url: "https://brightofhouse.jp/icon.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://brightofhouse.jp/blog/${post.slug}`,
    },
  };

  return (
    <main className="min-h-screen bg-white pb-20 text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }}
      />
      {/* ナビゲーション＋タイトル（アイキャッチ or 本文最初の画像があれば背景に・無ければ通常背景） */}
      <div
        className={`relative border-b border-slate-200 pt-10 pb-16 px-4 ${headerBg ? "text-white" : "bg-slate-50"}`}
        style={headerBg ? { backgroundImage: `url(${headerBg})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {headerBg && <div className="absolute inset-0 bg-black/50" aria-hidden />}
        <div className="relative max-w-3xl mx-auto">
          <Link href="/blog" className={`text-sm mb-6 inline-block font-bold transition-colors ${headerBg ? "text-white/90 hover:text-white" : "text-blue-600 hover:underline"}`}>
            ← お掃除ブログ一覧へ戻る
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <time className={`text-sm font-medium px-3 py-1 rounded-full border ${headerBg ? "bg-white/20 border-white/30 text-white" : "text-slate-500 bg-white border-slate-200"}`}>
              {new Date(post.createdAt).toLocaleDateString("ja-JP")}
            </time>
            {post.category && (
              <Link
                href={`/blog?category=${post.category.slug}`}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${headerBg ? "bg-white/20 text-white hover:bg-white/30" : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"}`}
              >
                {post.category.name}
              </Link>
            )}
          </div>
          <h1 className={`text-2xl md:text-4xl font-bold leading-tight ${headerBg ? "text-white drop-shadow" : "text-slate-900"}`}>
            {post.title}
          </h1>
        </div>
      </div>

      {/* 記事本文 */}
      <article className="max-w-3xl mx-auto px-4 py-12">
        <div
          className="bn-content ql-content prose prose-slate prose-base md:prose-lg max-w-none text-slate-700 leading-loose"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />


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
