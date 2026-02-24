// @/src/app/api/menu/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

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

// GET: 一覧取得
export async function GET() {
  try {
    const menus = await prisma.serviceMenu.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json(menus);
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// POST: 新規作成
export async function POST(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const newMenu = await prisma.serviceMenu.create({
      data: {
        title: body.title,
        price: body.price,
        priceNote: body.priceNote, // ▼ 追加: これがないと保存されません
        unit: body.unit || "円〜",
        description: body.description,
        features: body.features,
        isPopular: body.isPopular || false,
        order: Number(body.order) || 0,
        link: body.link || "/service",
      },
    });
    return NextResponse.json(newMenu);
  } catch (error) {
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

// PUT: 更新
export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const updatedMenu = await prisma.serviceMenu.update({
      where: { id: body.id },
      data: {
        title: body.title,
        price: body.price,
        priceNote: body.priceNote, // ▼ 追加: 更新時も必要
        unit: body.unit,
        description: body.description,
        features: body.features,
        isPopular: body.isPopular,
        order: Number(body.order),
        link: body.link,
      },
    });
    return NextResponse.json(updatedMenu);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE: 削除
export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await request.json();
    await prisma.serviceMenu.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}