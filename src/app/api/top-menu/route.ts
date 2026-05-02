// @/src/app/api/top-menu/route.ts
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
  const menus = await prisma.serviceMenu.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(menus);
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const menu = await prisma.serviceMenu.create({ data });
  return NextResponse.json(menu);
}

export async function PUT(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const { id, ...rest } = data;
  const menu = await prisma.serviceMenu.update({ where: { id }, data: rest });
  return NextResponse.json(menu);
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await prisma.serviceMenu.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
