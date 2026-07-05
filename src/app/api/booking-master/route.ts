// @/src/app/api/booking-master/route.ts
import { NextRequest, NextResponse } from "next/server";
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
            }
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

  try {
    const body = await request.json();

    if (body.type === "category") {
      return NextResponse.json(await prisma.bookingCategory.create({
        data: {
          title: body.title,
          order: body.order,
          setDiscountRules: body.setDiscountRules ?? undefined,
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
          order: body.order,
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
          order: body.order,
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
          order: body.order,
          subMenuId: body.subMenuId,
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

  try {
    const body = await request.json();
    const { type, id, ...data } = body;

    if (type === "category") {
      return NextResponse.json(await prisma.bookingCategory.update({
        where: { id },
        data: {
          title: data.title,
          order: data.order,
          setDiscountRules: data.setDiscountRules ?? undefined,
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
          order: data.order,
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
          order: data.order,
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
          order: data.order,
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

  try {
    const { id, type } = await request.json();
    if (type === "category") await prisma.bookingCategory.delete({ where: { id } });
    else if (type === "menu") await prisma.bookingMenu.delete({ where: { id } });
    else if (type === "submenu") await prisma.bookingSubMenu.delete({ where: { id } });
    else if (type === "option") await prisma.bookingOption.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}