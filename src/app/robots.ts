// @/src/app/robots.ts
import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

// ビルド時のエラーを回避するため、動的生成を指定
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = "https://brightofhouse.jp";

  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "main" },
    });

    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: "/admin/",
      },
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  } catch (error) {
    // テーブルがない場合などのフォールバック
    return {
      rules: { userAgent: "*", allow: "/", disallow: "/admin/" },
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }
}