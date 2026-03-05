// @/src/app/sitemap.ts
import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

// 動的生成を指定
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://brightofhouse.jp";

  const staticPaths = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${baseUrl}/service`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/before-after`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/company`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
  ];

  try {
    const lps = await prisma.landingPage.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true, category: true },
    });

    const lpPaths = lps.map((lp) => ({
      url: `${baseUrl}/${lp.category === "AREA" ? "area" : "lp"}/${lp.slug}`,
      lastModified: lp.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticPaths, ...lpPaths];
  } catch (error) {
    return staticPaths;
  }
}