// @/src/app/api/hero/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();

// 認証チェック
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

// GET: 設定取得
export async function GET() {
  try {
    const settings = await prisma.heroSettings.findUnique({
      where: { id: "main" },
    });
    return NextResponse.json(settings || {
      title: "北海道ブライトオブハウス",
      subtitle: "ハウスクリーニング / エアコン清掃 / 特殊清掃",
      mobileHeight: "h-[50vh]", // デフォルト
      pcHeight: "md:h-[65vh]",  // デフォルト
      btn1Text: "無料お見積り",
      btn1Link: "/contact",
      btn2Text: "料金を見る",
      btn2Link: "/service",
    });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// PUT: 設定更新
export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const settings = await prisma.heroSettings.upsert({
      where: { id: "main" },
      update: body,
      create: { id: "main", ...body },
    });
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}