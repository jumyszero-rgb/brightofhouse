// @/src/app/api/company/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();

// --- 認証チェック関数 ---
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

// --- IndexNowへの通知ヘルパー関数 ---
async function notifyIndexNow(urls: string[]) {
  const baseUrl = process.env.BASE_URL || "https://brightofhouse.jp";
  const fullUrls = urls.map(url => `${baseUrl}${url}`);

  try {
    const response = await fetch(`${baseUrl}/api/indexnow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: fullUrls }),
    });
    if (!response.ok) {
      console.error("Failed to notify IndexNow:", await response.text());
    } else {
      console.log("Successfully notified IndexNow for:", fullUrls);
    }
  } catch (error) {
    console.error("Error notifying IndexNow:", error);
  }
}

// GET: 情報取得
export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await prisma.companyProfile.findUnique({
      where: { id: "main" },
    });
    return NextResponse.json(profile || {});
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// PUT: 情報更新
export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    const profile = await prisma.companyProfile.upsert({
      where: { id: "main" },
      update: {
        name: body.name,
        representative: body.representative,
        address: body.address,
        tel: body.tel,
        businessContent: body.businessContent,
        businessHours: body.businessHours,
        mapCode: body.mapCode,
      },
      create: {
        id: "main",
        name: body.name,
        representative: body.representative,
        address: body.address,
        tel: body.tel,
        businessContent: body.businessContent,
        businessHours: body.businessHours,
        mapCode: body.mapCode,
      },
    });

    // ▼ IndexNowに通知
    await notifyIndexNow([`/company`]); // 会社概要ページを通知

    return NextResponse.json(profile);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}