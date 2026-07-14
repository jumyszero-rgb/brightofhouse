// @/src/app/api/booking/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendBookingNotification, sendBookingConfirmationToUser } from "@/lib/mail";

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
        phone: body.tel || body.phone,
        address: body.address,
        notes: body.notes,
        startTime: new Date(body.startTime + "+09:00"),
        endTime: new Date(body.endTime + "+09:00"),

        status: "PENDING",
        items: body.items || "未選択",
        totalPrice: Number(body.totalPrice) || 0,
        totalMinutes: Number(body.totalMinutes) || 60,
      }
    });

    const mailData = {
      ...booking,
      zip: body.zip || "",
      contactMethod: body.contactMethod || "未指定",
      totalMinutesDisplay: body.totalMinutes || "未定",
      dateUndecided: !!body.dateUndecided,
      inquiryOnly: !!body.inquiryOnly,
    };

    sendBookingNotification(mailData).catch(err => console.error("Admin Email notification error:", err));
    sendBookingConfirmationToUser(mailData).catch(err => console.error("User Email notification error:", err));

    return NextResponse.json(booking);


  } catch (error: any) {
    console.error("Booking POST Error:", error.message);
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}