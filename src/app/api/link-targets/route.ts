// @/src/app/api/link-targets/route.ts
// 得意分野カードなどのリンク先に使える「サービス」の一覧を返す。
// - サービス詳細ページ（公開中のservicePage） → /service/<slug>
// - サービス一覧のカテゴリ（serviceCategory）   → /service#cat-<id>
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [pages, categories] = await Promise.all([
      prisma.servicePage.findMany({
        where: { status: "PUBLISHED", noIndex: false },
        select: { slug: true, title: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.serviceCategory.findMany({
        select: { id: true, title: true },
        orderBy: { order: "asc" },
      }),
    ]);

    const targets = [
      ...categories.map((c) => ({
        label: `【一覧カテゴリ】${c.title}`,
        href: `/service#cat-${c.id}`,
      })),
      ...pages.map((p) => ({
        label: `【詳細ページ】${p.title}`,
        href: `/service/${p.slug}`,
      })),
      { label: "【固定】サービス一覧トップ（/service）", href: "/service" },
    ];

    return NextResponse.json(targets);
  } catch {
    return NextResponse.json([]);
  }
}
