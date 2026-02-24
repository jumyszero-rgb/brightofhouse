// @/src/app/api/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// 認証チェック関数
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

// GET: 全データ取得（階層構造込み・表示順ソート）
export async function GET() {
  try {
    const data = await prisma.serviceCategory.findMany({
      include: {
        items: {
          include: { details: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// POST: 新規作成
export async function POST(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    const body = await request.json();
    
    // 大分類（カテゴリ）作成
    if (body.type === "category") {
      const res = await prisma.serviceCategory.create({
        data: { 
          title: body.title, 
          order: body.order 
        },
      });
      return NextResponse.json(res);
    }
    
    // 中分類（アイテム）作成
    if (body.type === "item") {
      const res = await prisma.serviceItem.create({
        data: { 
          title: body.title, 
          subTitle: body.subTitle,
          regularPrice: body.regularPrice,   // 通常価格
          discountPrice: body.discountPrice, // 特別価格
          categoryId: body.categoryId,
          order: body.order 
        },
      });
      return NextResponse.json(res);
    }

    // 小分類（詳細）作成
    if (body.type === "detail") {
      const res = await prisma.serviceDetail.create({
        data: {
          label: body.label,
          value: body.value,
          isPrice: body.isPrice,
          isNote: body.isNote,
          // スタイル設定
          labelColor: body.labelColor || "default",
          labelSize: body.labelSize || "sm",
          labelAlign: body.labelAlign || "left",
          valueColor: body.valueColor || "default",
          valueSize: body.valueSize || "base",
          valueAlign: body.valueAlign || "right",
          
          itemId: body.itemId,
          order: body.order,
        },
      });
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

// PUT: 更新
export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    const body = await request.json();
    const { type, id, ...data } = body;

    // 大分類更新
    if (type === "category") {
      const res = await prisma.serviceCategory.update({
        where: { id },
        data: { 
          title: data.title,
          order: data.order 
        },
      });
      return NextResponse.json(res);
    }

    // 中分類更新
    if (type === "item") {
      const res = await prisma.serviceItem.update({
        where: { id },
        data: { 
          title: data.title, 
          subTitle: data.subTitle,
          regularPrice: data.regularPrice,   // 通常価格
          discountPrice: data.discountPrice, // 特別価格
          order: data.order 
        },
      });
      return NextResponse.json(res);
    }

    // 小分類更新
    if (type === "detail") {
      const res = await prisma.serviceDetail.update({
        where: { id },
        data: {
          label: data.label,
          value: data.value,
          isPrice: data.isPrice,
          isNote: data.isNote,
          // スタイル設定
          labelColor: data.labelColor,
          labelSize: data.labelSize,
          labelAlign: data.labelAlign,
          valueColor: data.valueColor,
          valueSize: data.valueSize,
          valueAlign: data.valueAlign,
          
          order: data.order
        },
      });
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE: 削除
export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    const { id, type } = await request.json();
    
    if (type === "category") await prisma.serviceCategory.delete({ where: { id } });
    else if (type === "item") await prisma.serviceItem.delete({ where: { id } });
    else if (type === "detail") await prisma.serviceDetail.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}