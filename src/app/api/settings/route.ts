// @/src/app/api/settings/route.ts
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

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: "main" } });
    return NextResponse.json(settings || {
      robotsTxt: "User-agent: *\nAllow: /\nDisallow: /admin/",
      reviewIpBlock: true,
      calendarStartHour: 5,
      calendarEndHour: 22,
    });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const res = await prisma.siteSettings.upsert({
      where: { id: "main" },
      update: {
        robotsTxt: body.robotsTxt,
        ...(body.reviewIpBlock !== undefined && { reviewIpBlock: body.reviewIpBlock }),
        ...(body.calendarStartHour !== undefined && { calendarStartHour: body.calendarStartHour }),
        ...(body.calendarEndHour !== undefined && { calendarEndHour: body.calendarEndHour }),
      },
      create: {
        id: "main",
        robotsTxt: body.robotsTxt,
        ...(body.reviewIpBlock !== undefined && { reviewIpBlock: body.reviewIpBlock }),
        ...(body.calendarStartHour !== undefined && { calendarStartHour: body.calendarStartHour }),
        ...(body.calendarEndHour !== undefined && { calendarEndHour: body.calendarEndHour }),
      },
    });
    return NextResponse.json(res);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
