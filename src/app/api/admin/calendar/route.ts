// @/src/app/api/admin/calendar/route.ts
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
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const overrides = await prisma.calendarOverride.findMany();
    return NextResponse.json(overrides);
  } catch (error) {
    return NextResponse.json({ error: "Fetch error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth())) {
    console.error("Calendar API: Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { slotTime, status } = await request.json();
    console.log("Calendar API POST:", { slotTime, status });
    
    // すでに設定があれば更新、なければ作成 (Upsert)
    const result = await prisma.calendarOverride.upsert({
      where: { slotTime: new Date(slotTime) },
      update: { status },
      create: { slotTime: new Date(slotTime), status },
    });

    console.log("Calendar API Save Success:", result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Calendar API POST Error:", error);
    return NextResponse.json({ error: "Save error: " + error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) {
    console.error("Calendar API: Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { slotTime } = await request.json();
    console.log("Calendar API DELETE:", { slotTime });

    await prisma.calendarOverride.delete({
      where: { slotTime: new Date(slotTime) },
    });

    console.log("Calendar API Delete Success");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Calendar API DELETE Error:", error);
    return NextResponse.json({ error: "Delete error: " + error.message }, { status: 500 });
  }
}