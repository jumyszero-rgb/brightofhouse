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
  ];

  try {
    // データベースから公開済みのLPをすべて取得
    const lps = await prisma.landingPage.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true, category: true, linkTitle: true, title: true },
    });

    const lpPaths = lps
      .filter((lp) => lp.category === "AREA") // /lp/* は除外（noindex運用）。/area のみ掲載
      .map((lp) => ({
        url: `${baseUrl}/area/${lp.slug}`,
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

    // データベースから公開済みのサービス詳細ページをすべて取得（リダイレクト設定済みは除外）
    const servicePages = await prisma.servicePage.findMany({
      where: { status: "PUBLISHED", noIndex: false, redirectUrl: null },
      select: { slug: true, updatedAt: true },
    });

    const servicePaths = servicePages.map((sp) => ({
      url: `${baseUrl}/service/${sp.slug}`,
      lastModified: sp.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // すべてを統合して返却
    return [...staticPaths, ...lpPaths, ...blogPaths, ...servicePaths] as MetadataRoute.Sitemap;
  } catch (error) {
    // テーブルがない場合などのフォールバック
    console.error("Error generating sitemap:", error);
    return staticPaths; // エラー時は固定パスのみ返す
  }
}