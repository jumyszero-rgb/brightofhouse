// @/src/app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin/", // 管理画面はクロールさせない
    },
    sitemap: "https://brightofhouse.jp/sitemap.xml",
  };
}