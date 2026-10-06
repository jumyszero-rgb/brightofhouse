// @/src/app/api/service-items/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const items = await prisma.serviceItem.findMany({
      orderBy: { order: "asc" },
      select: { id: true, title: true, subTitle: true },
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
