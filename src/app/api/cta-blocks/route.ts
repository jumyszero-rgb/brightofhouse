// @/src/app/api/cta-blocks/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

async function checkAuth() {
  try {
    const token = (await cookies()).get("admin_token")?.value;
    if (!token) return false;
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return true;
  } catch { return false; }
}

export async function GET() {
  try {
    const blocks = await prisma.ctaBlock.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(blocks);
  } catch (error) {
    console.error("CTA取得エラー:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const block = await prisma.ctaBlock.create({ data: body });
    return NextResponse.json(block);
  } catch (error) {
    console.error("CTA作成エラー:", error);
    return NextResponse.json({ error: "作成失敗" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { id, createdAt, updatedAt, ...data } = body;
    const block = await prisma.ctaBlock.update({ where: { id }, data });
    return NextResponse.json(block);
  } catch (error) {
    console.error("CTA更新エラー:", error);
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID必須" }, { status: 400 });
    await prisma.ctaBlock.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CTA削除エラー:", error);
    return NextResponse.json({ error: "削除失敗" }, { status: 500 });
  }
}
