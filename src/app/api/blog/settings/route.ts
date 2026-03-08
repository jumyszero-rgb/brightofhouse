// @/src/app/api/blog/settings/route.ts
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
  } catch { return false; }
}

export async function GET() {
  try {
    const settings = await prisma.blogSettings.findUnique({ where: { id: "main" } });
    return NextResponse.json(settings || { fixedKeywords: "", defaultIntro: "", defaultOutro: "" });
  } catch (error: any) {
    console.error("Blog Settings GET Error:", error.message);
    return NextResponse.json({ error: "Fetch error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    const body = await request.json();
    console.log("Saving Blog Settings:", body); // 送信データの確認用ログ

    const res = await prisma.blogSettings.upsert({
      where: { id: "main" },
      update: {
        fixedKeywords: body.fixedKeywords,
        defaultIntro: body.defaultIntro,
        defaultOutro: body.defaultOutro,
      },
      create: {
        id: "main",
        fixedKeywords: body.fixedKeywords,
        defaultIntro: body.defaultIntro,
        defaultOutro: body.defaultOutro,
      },
    });

    console.log("Save Success!");
    return NextResponse.json(res);
  } catch (error: any) {
    // ここでエラーの詳細をログに出します
    console.error("===== BLOG SETTINGS SAVE ERROR =====");
    console.error("Message:", error.message);
    console.error("Code:", error.code); // Prismaのエラーコード
    console.error("====================================");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}