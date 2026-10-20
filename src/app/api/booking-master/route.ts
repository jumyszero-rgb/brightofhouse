// @/src/app/api/booking-master/route.ts
import { NextRequest, NextResponse } from "next/server";
import { bustServerMemo } from "@/lib/serverMemo";
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

// GET: 4階層の全予約マスターデータを取得
export async function GET() {
  try {
    const data = await prisma.bookingCategory.findMany({
      include: {
        menus: {
          include: {
            subMenus: {
              include: {
                options: { orderBy: { order: "asc" } }
              },
              orderBy: { order: "asc" },
            },
            options: { orderBy: { order: "asc" } },
            // ぶら下げた項目（ほかの中分類・小分類への参照）。表示名は画面側で予約マスター全体から引く
            attachments: { orderBy: { order: "asc" } },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Booking Master GET Error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// POST: 各階層の作成
export async function POST(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  bustServerMemo(); // 公開ページの作り置きを捨てる（保存内容をすぐ反映）

  try {
    const body = await request.json();

    // 中分類の下に、ほかの中分類・小分類をぶら下げる（参照）
    if (body.type === "attachment") {
      const parentMenuId = String(body.parentMenuId || "");
      const refMenuId = body.refMenuId ? String(body.refMenuId) : null;
      const refSubMenuId = body.refSubMenuId ? String(body.refSubMenuId) : null;
      if (!parentMenuId || (!refMenuId && !refSubMenuId) || (refMenuId && refSubMenuId)) {
        return NextResponse.json({ error: "ぶら下げる項目を1つ選んでください" }, { status: 400 });
      }
      if (refMenuId === parentMenuId) return NextResponse.json({ error: "自分自身はぶら下げられません" }, { status: 400 });
      if (refSubMenuId) {
        const sub = await prisma.bookingSubMenu.findUnique({ where: { id: refSubMenuId }, select: { menuId: true } });
        if (!sub) return NextResponse.json({ error: "小分類が見つかりません" }, { status: 400 });
        if (sub.menuId === parentMenuId) return NextResponse.json({ error: "この中分類の小分類はすでに表示されています" }, { status: 400 });
      }
      const dup = await prisma.bookingMenuAttachment.findFirst({ where: { parentMenuId, refMenuId, refSubMenuId } });
      if (dup) return NextResponse.json({ error: "すでにぶら下げています" }, { status: 400 });
      const count = await prisma.bookingMenuAttachment.count({ where: { parentMenuId } });
      return NextResponse.json(await prisma.bookingMenuAttachment.create({
        data: { parentMenuId, refMenuId, refSubMenuId, order: Number.isFinite(Number(body.order)) ? Number(body.order) : count },
      }));
    }

    if (body.type === "category") {
      return NextResponse.json(await prisma.bookingCategory.create({
        data: {
          title: body.title,
          order: body.order,
          calendarOrder: body.calendarOrder ?? null,
          setDiscountRules: body.setDiscountRules ?? undefined,
          listPriceNote: body.listPriceNote || null,
          minItemsRule: body.minItemsRule ?? undefined,
        },
      }));
    }

    if (body.type === "menu") {
      return NextResponse.json(await prisma.bookingMenu.create({
        data: {
          title: body.title,
          basePrice: Number(body.basePrice) || 0,
          priceNote: body.priceNote,
          workContent: body.workContent,
          cautionNote: body.cautionNote,
          recommendPoint: body.recommendPoint,
          onSiteEstimate: body.onSiteEstimate || "NONE",
          durationMin: Number(body.durationMin) || 0,
          durationMax: body.durationMax != null ? Number(body.durationMax) : undefined,
          setDiscountRules: body.setDiscountRules ?? undefined,
          discountPercent: body.discountPercent != null && body.discountPercent !== "" ? Number(body.discountPercent) : null,
          discountRounding: body.discountRounding || "NONE",
          webSpecialPrice: body.webSpecialPrice != null && body.webSpecialPrice !== "" ? Number(body.webSpecialPrice) : null,
          maxQty: body.maxQty != null && body.maxQty !== "" ? Number(body.maxQty) : null,
          qtyDiscountRules: body.qtyDiscountRules ?? undefined,
          imageUrl: body.imageUrl || null,
          topFeaturedOrder: body.topFeaturedOrder != null && body.topFeaturedOrder !== "" ? Number(body.topFeaturedOrder) : null,
          showOnServiceList: !!body.showOnServiceList,
          showOnCalendar: body.showOnCalendar != null ? !!body.showOnCalendar : true,
          detailPageSlug: body.detailPageSlug || null,
          listPriceOverride: body.listPriceOverride || null,
          priceFrom: !!body.priceFrom,
          order: body.order,
          calendarOrder: body.calendarOrder ?? null,
          categoryId: body.categoryId,
        },
      }));
    }

    if (body.type === "submenu") {
      return NextResponse.json(await prisma.bookingSubMenu.create({
        data: {
          title: body.title,
          price: Number(body.price) || 0,
          durationMin: Number(body.durationMin) || 0,
          durationMax: body.durationMax != null ? Number(body.durationMax) : undefined,
          workContent: body.workContent,
          cautionNote: body.cautionNote,
          recommendPoint: body.recommendPoint,
          onSiteEstimate: body.onSiteEstimate || "NONE",
          discountPercent: body.discountPercent != null && body.discountPercent !== "" ? Number(body.discountPercent) : null,
          discountRounding: body.discountRounding || "NONE",
          webSpecialPrice: body.webSpecialPrice != null && body.webSpecialPrice !== "" ? Number(body.webSpecialPrice) : null,
          maxQty: body.maxQty != null && body.maxQty !== "" ? Number(body.maxQty) : null,
          qtyDiscountRules: body.qtyDiscountRules ?? undefined,
          priceFrom: !!body.priceFrom,
          order: body.order,
          calendarOrder: body.calendarOrder ?? null,
          menuId: body.menuId,
        },
      }));
    }

    if (body.type === "option") {
      return NextResponse.json(await prisma.bookingOption.create({
        data: {
          title: body.title,
          price: Number(body.price) || 0,
          durationMin: Number(body.durationMin) || 0,
          durationMax: body.durationMax != null ? Number(body.durationMax) : undefined,
          workContent: body.workContent,
          cautionNote: body.cautionNote,
          recommendPoint: body.recommendPoint,
          onSiteEstimate: body.onSiteEstimate || "NONE",
          maxQty: body.maxQty != null && body.maxQty !== "" ? Number(body.maxQty) : null,
          discountPercent: body.discountPercent != null && body.discountPercent !== "" ? Number(body.discountPercent) : null,
          discountRounding: body.discountRounding || "NONE",
          qtyDiscountRules: body.qtyDiscountRules ?? undefined,
          priceFrom: !!body.priceFrom,
          order: body.order,
          calendarOrder: body.calendarOrder ?? null,
          subMenuId: body.subMenuId || null,
          menuId: body.menuId || null,
        },
      }));
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

// PUT: 更新
export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  bustServerMemo(); // 公開ページの作り置きを捨てる（保存内容をすぐ反映）

  try {
    const body = await request.json();
    const { type, id, ...data } = body;

    if (type === "attachment") {
      return NextResponse.json(await prisma.bookingMenuAttachment.update({
        where: { id },
        data: { order: Number(data.order) || 0 },
      }));
    }

    if (type === "category") {
      return NextResponse.json(await prisma.bookingCategory.update({
        where: { id },
        data: {
          title: data.title,
          order: data.order,
          calendarOrder: data.calendarOrder !== undefined ? data.calendarOrder : undefined,
          setDiscountRules: data.setDiscountRules ?? undefined,
          // 送られてきた時だけ更新（セット割引や表示順だけの保存で一覧の「〇〇円〜」が消えないように）
          listPriceNote: data.listPriceNote !== undefined ? (data.listPriceNote || null) : undefined,
          minItemsRule: data.minItemsRule !== undefined && data.minItemsRule !== null ? data.minItemsRule : undefined,
        },
      }));
    }

    if (type === "menu") {
      return NextResponse.json(await prisma.bookingMenu.update({
        where: { id },
        data: {
          title: data.title,
          basePrice: Number(data.basePrice),
          priceNote: data.priceNote,
          workContent: data.workContent,
          cautionNote: data.cautionNote,
          recommendPoint: data.recommendPoint,
          onSiteEstimate: data.onSiteEstimate || "NONE",
          durationMin: Number(data.durationMin),
          durationMax: data.durationMax != null ? Number(data.durationMax) : undefined,
          setDiscountRules: data.setDiscountRules ?? undefined,
          discountPercent: data.discountPercent != null && data.discountPercent !== "" ? Number(data.discountPercent) : null,
          discountRounding: data.discountRounding || "NONE",
          webSpecialPrice: data.webSpecialPrice != null && data.webSpecialPrice !== "" ? Number(data.webSpecialPrice) : null,
          maxQty: data.maxQty != null && data.maxQty !== "" ? Number(data.maxQty) : null,
          qtyDiscountRules: data.qtyDiscountRules ?? undefined,
          imageUrl: data.imageUrl ?? undefined,
          topFeaturedOrder: data.topFeaturedOrder === "" ? null : (data.topFeaturedOrder != null ? Number(data.topFeaturedOrder) : undefined),
          showOnServiceList: data.showOnServiceList != null ? !!data.showOnServiceList : undefined,
          showOnCalendar: data.showOnCalendar != null ? !!data.showOnCalendar : undefined,
          detailPageSlug: data.detailPageSlug !== undefined ? (data.detailPageSlug || null) : undefined,
          listPriceOverride: data.listPriceOverride !== undefined ? (data.listPriceOverride || null) : undefined,
          priceFrom: data.priceFrom != null ? !!data.priceFrom : undefined,
          order: data.order,
          calendarOrder: data.calendarOrder !== undefined ? data.calendarOrder : undefined,
        },
      }));
    }

    if (type === "submenu") {
      return NextResponse.json(await prisma.bookingSubMenu.update({
        where: { id },
        data: {
          title: data.title,
          price: Number(data.price),
          durationMin: Number(data.durationMin),
          durationMax: data.durationMax != null ? Number(data.durationMax) : undefined,
          workContent: data.workContent,
          cautionNote: data.cautionNote,
          recommendPoint: data.recommendPoint,
          onSiteEstimate: data.onSiteEstimate || "NONE",
          discountPercent: data.discountPercent != null && data.discountPercent !== "" ? Number(data.discountPercent) : null,
          discountRounding: data.discountRounding || "NONE",
          webSpecialPrice: data.webSpecialPrice != null && data.webSpecialPrice !== "" ? Number(data.webSpecialPrice) : null,
          maxQty: data.maxQty != null && data.maxQty !== "" ? Number(data.maxQty) : null,
          qtyDiscountRules: data.qtyDiscountRules ?? undefined,
          priceFrom: data.priceFrom != null ? !!data.priceFrom : undefined,
          order: data.order,
          calendarOrder: data.calendarOrder !== undefined ? data.calendarOrder : undefined,
        },
      }));
    }

    if (type === "option") {
      return NextResponse.json(await prisma.bookingOption.update({
        where: { id },
        data: {
          title: data.title,
          price: Number(data.price),
          durationMin: Number(data.durationMin),
          durationMax: data.durationMax != null ? Number(data.durationMax) : undefined,
          workContent: data.workContent,
          cautionNote: data.cautionNote,
          recommendPoint: data.recommendPoint,
          onSiteEstimate: data.onSiteEstimate || "NONE",
          maxQty: data.maxQty != null && data.maxQty !== "" ? Number(data.maxQty) : null,
          discountPercent: data.discountPercent != null && data.discountPercent !== "" ? Number(data.discountPercent) : null,
          discountRounding: data.discountRounding || "NONE",
          qtyDiscountRules: data.qtyDiscountRules ?? undefined,
          priceFrom: data.priceFrom != null ? !!data.priceFrom : undefined,
          order: data.order,
          calendarOrder: data.calendarOrder !== undefined ? data.calendarOrder : undefined,
        },
      }));
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE: 削除
export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  bustServerMemo(); // 公開ページの作り置きを捨てる（保存内容をすぐ反映）

  try {
    const { id, type } = await request.json();
    if (type === "category") await prisma.bookingCategory.delete({ where: { id } });
    else if (type === "menu") await prisma.bookingMenu.delete({ where: { id } });
    else if (type === "submenu") await prisma.bookingSubMenu.delete({ where: { id } });
    else if (type === "option") await prisma.bookingOption.delete({ where: { id } });
    else if (type === "attachment") await prisma.bookingMenuAttachment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}