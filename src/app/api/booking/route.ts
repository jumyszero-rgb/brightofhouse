// @/src/app/api/booking/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 空き枠取得 (指定カテゴリの予約済み時間を取得)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  
  try {
    const bookings = await prisma.booking.findMany({
      where: { category: category || undefined },
      select: { startTime: true, endTime: true }
    });
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

// 仮予約の作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const booking = await prisma.booking.create({
      data: {
        category: body.category,
        customerName: body.name,
        email: body.email,
        phone: body.tel || body.phone, // フロントエンドの送信名に合わせる
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        status: "PENDING",
        // ▼ 追加: 必須になった計算用データ（送られてこない場合は初期値を入れる）
        items: body.items || "未選択",
        totalPrice: Number(body.totalPrice) || 0,
        totalMinutes: Number(body.totalMinutes) || 60,
      }
    });
    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Booking POST Error:", error.message);
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}