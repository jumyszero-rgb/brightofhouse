// @/src/app/rss.xml/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic"; // 常に最新のフィードを生成

export async function GET(request: NextRequest) {
  const baseUrl = process.env.BASE_URL || "https://brightofhouse.jp";

  // 公開済みの最新記事を10件取得
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const feedItems = posts.map((post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid>${baseUrl}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      <description>${escapeXml(stripHtml(post.content).substring(0, 200) + '...')}</description>
    </item>
  `).join('');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>北海道ブライトオブハウス 公式ブログ</title>
    <link>${baseUrl}/blog</link>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <description>札幌の清掃プロが教える、お掃除のコツや最新の活動報告をお届けします。</description>
    <language>ja-jp</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${feedItems}
  </channel>
</rss>`;

  return new NextResponse(rssFeed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, must-revalidate", // 10分間キャッシュ
    },
  });
}

// XMLエンコードヘルパー
function escapeXml(unsafe: string | null): string {
  if (!unsafe) return "";
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
    return c; // fallthrough
  });
}

// HTMLタグ除去ヘルパー (description用)
function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, '');
}