// @/src/app/api/lp/duplicate/route.ts
// LPの複製（管理画面のLP一覧の「複製」ボタン）。サーバー側で元のLPを丸ごとコピーする。
//  - コピーするもの：本文・ブロック（ブロックLP）・リッチLPの全項目・SEO項目・ヒーロー画像URL・
//    予約マスター連動（大分類・中分類・料金表／追加メニューの連動・口コミ／FAQの連動先・施工事例）
//  - 変えるもの：URL（元のURL-copy-数字）・タイトル（末尾に「（コピー）」）・下書き・検索に出さない（noindex）・
//    トップに出さない・canonical は空
// 以前は画面側で項目を1つずつ送っていたため、ブロックLPのブロックや、後から増えた連動項目がコピーされていなかった。
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

// JSON型の項目（空なら DB の NULL にする）
const JSON_KEYS = [
  "blocks",
  "bookingData",
  "pains",
  "menuItems",
  "menuOptions",
  "baseWork",
  "recommended",
  "reasons",
  "faqItems",
  "voices",
  "steps",
  "infoSections",
] as const;

export async function POST(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id がありません" }, { status: 400 });

    const ids = { select: { id: true } } as const;
    const src = await prisma.landingPage.findUnique({
      where: { id: String(id) },
      include: {
        bookingMenus: ids,
        bookingCategories: ids,
        beforeAfters: ids,
        menuOptionRefs: ids,
        menuSubMenuRefs: ids,
        menuItemRefs: ids,
        testimonialServicePages: ids,
        faqServicePages: ids,
      },
    });
    if (!src) return NextResponse.json({ error: "元のLPが見つかりません" }, { status: 404 });

    const {
      id: _id,
      createdAt: _c,
      updatedAt: _u,
      slug,
      title,
      bookingMenus,
      bookingCategories,
      beforeAfters,
      menuOptionRefs,
      menuSubMenuRefs,
      menuItemRefs,
      testimonialServicePages,
      faqServicePages,
      ...rest
    } = src;

    // 重ならないURLを決める（元のURL-copy-数字）
    let newSlug = "";
    for (let i = 0; i < 5; i++) {
      const cand = `${slug}-copy-${Date.now().toString().slice(-5)}${i ? `-${i}` : ""}`;
      const exists = await prisma.landingPage.findUnique({ where: { slug: cand }, select: { id: true } });
      if (!exists) {
        newSlug = cand;
        break;
      }
    }
    if (!newSlug) return NextResponse.json({ error: "URLを決められませんでした。もう一度お試しください" }, { status: 409 });

    const data: Record<string, unknown> = { ...rest };
    for (const k of JSON_KEYS) {
      if (k in data) data[k] = data[k] == null ? Prisma.DbNull : (data[k] as Prisma.InputJsonValue);
    }
    const connect = (arr: { id: string }[]) => ({ connect: arr.map((x) => ({ id: x.id })) });

    const created = await prisma.landingPage.create({
      data: {
        ...(data as Omit<Prisma.LandingPageCreateInput, "slug" | "title">),
        slug: newSlug,
        title: `${title}（コピー）`,
        status: "DRAFT",
        noIndex: true,
        showOnHome: false,
        canonicalUrl: null,
        bookingMenus: connect(bookingMenus),
        bookingCategories: connect(bookingCategories),
        beforeAfters: connect(beforeAfters),
        menuOptionRefs: connect(menuOptionRefs),
        menuSubMenuRefs: connect(menuSubMenuRefs),
        menuItemRefs: connect(menuItemRefs),
        testimonialServicePages: connect(testimonialServicePages),
        faqServicePages: connect(faqServicePages),
      },
      select: { id: true, slug: true, title: true, templateStyle: true },
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error("[lp/duplicate] failed", error);
    return NextResponse.json({ error: "複製に失敗しました" }, { status: 500 });
  }
}
