// @/src/app/sitemap.ts
import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

// 動的生成を指定
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.BASE_URL || "https://brightofhouse.jp";

  // 固定ページの定義
  const staticPaths = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${baseUrl}/service`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/before-after`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/company`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    // ▼ 追加: RSSフィードをサイトマップに含める
    { url: `${baseUrl}/rss.xml`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
  ];

  try {
    // データベースから公開済みのLPをすべて取得
    const lps = await prisma.landingPage.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true, category: true, linkTitle: true, title: true },
    });

    const lpPaths = lps.map((lp) => ({
      url: `${baseUrl}/${lp.category === "AREA" ? "area" : "lp"}/${lp.slug}`,
      lastModified: lp.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // データベースから公開済みのブログ記事をすべて取得
    const blogPosts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    });

    const blogPaths = blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));

    // すべてを統合して返却
    return [...staticPaths, ...lpPaths, ...blogPaths] as MetadataRoute.Sitemap;
  } catch (error) {
    // テーブルがない場合などのフォールバック
    console.error("Error generating sitemap:", error);
    return staticPaths; // エラー時は固定パスのみ返す
  }
}