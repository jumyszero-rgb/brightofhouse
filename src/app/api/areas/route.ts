// @/src/app/api/areas/route.ts
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
    const areas = await prisma.serviceArea.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json(areas);
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// POST: 新規作成
export async function POST(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const res = await prisma.serviceArea.create({
      data: {
        title: body.title,
        regions: body.regions,
        note: body.note,
        order: Number(body.order) || 0,
      },
    });
    return NextResponse.json(res);
  } catch (error) {
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

// PUT: 更新
export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const res = await prisma.serviceArea.update({
      where: { id: body.id },
      data: {
        title: body.title,
        regions: body.regions,
        note: body.note,
        order: Number(body.order),
      },
    });
    return NextResponse.json(res);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE: 削除
export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await request.json();
    await prisma.serviceArea.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}