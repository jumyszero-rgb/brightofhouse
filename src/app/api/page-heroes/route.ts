// @/src/app/api/page-heroes/route.ts
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

// GET: 全ページのヒーロー画像を { key: imageUrl } で返す
export async function GET() {
  try {
    const rows = await prisma.pageHero.findMany();
    const map: Record<string, string> = {};
    for (const r of rows) if (r.imageUrl) map[r.key] = r.imageUrl;
    return NextResponse.json(map);
  } catch {
    return NextResponse.json({});
  }
}

// PUT: { key, imageUrl } を保存（imageUrl空/nullで解除）
export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const key = String(body.key || "").trim();
    if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
    const imageUrl = body.imageUrl && String(body.imageUrl).trim() !== "" ? String(body.imageUrl).trim() : null;

    await prisma.pageHero.upsert({
      where: { key },
      update: { imageUrl },
      create: { key, imageUrl },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "保存に失敗しました: " + (e as Error).message }, { status: 500 });
  }
}
