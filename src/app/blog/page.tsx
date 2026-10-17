// @/src/app/blog/page.tsx
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { memo } from "@/lib/serverMemo";
import BlogListClient, { type BlogListPost, type BlogCategory } from "@/components/BlogListClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ブログ",
  description:
    "プロが教えるお掃除の知恵袋。札幌の水回りクリーニング・ハウスクリーニングのコツや、汚れ別の対処法、季節のお手入れ情報などを発信しています。",
  alternates: { canonical: "/blog" },
};

/** 一覧に必要な分だけに絞る（本文は送らない：検索用に先頭の文章だけ） */
function toListPost(p: any): BlogListPost {
  const content: string = p.content || "";
  const firstImg = content.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || "";
  const d = new Date(p.createdAt);
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    cover: p.thumbnail || firstImg,
    date: `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`,
    text: content.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").slice(0, 400),
    category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
  };
}

/**
 * 【表示速度対策 2026-10】
 * 以前は一覧をブラウザ側で /api/blog から取得していた（全記事の本文まで取得・表示まで数秒＋読み込み後にガタつき）。
 * → サーバーで一覧を作ってHTMLに入れる。カテゴリ・キーワードの絞り込みはブラウザ側で即時に行う。
 */
export default async function BlogListPage() {
  const [posts, categories] = await Promise.all([
    memo("blog:list", async () =>
      (
        await prisma.blogPost.findMany({
          where: { status: "PUBLISHED" },
          orderBy: { createdAt: "desc" },
          include: { category: true },
        })
      ).map(toListPost)
    ).catch(() => [] as BlogListPost[]),
    memo("blog:categories", () =>
      prisma.blogCategory.findMany({
        orderBy: { order: "asc" },
        include: { _count: { select: { posts: true } } },
      })
    ).catch(() => [] as BlogCategory[]),
  ]);

  return <BlogListClient initialPosts={posts} initialCategories={categories as BlogCategory[]} />;
}
