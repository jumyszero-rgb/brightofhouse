// @/src/app/api/company/route.ts
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

// GET: 情報取得（公開用なので認証なしでもOKだが、今回はサーバー内部で呼ぶのでAPIはロックしても良い。
// ただし、クライアント側でfetchするなら認証なしにする必要あり。
// 今回は公開ページはServer Componentで直接DBを見るので、APIは管理画面用としてロックします）
export async function GET() {
  // ※管理画面での表示用
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
    
    // upsert: データがあれば更新、なければ新規作成
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

    return NextResponse.json(profile);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}