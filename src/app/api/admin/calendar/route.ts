// @/src/app/api/admin/calendar/route.ts
// カレンダーの空き枠設定（CalendarOverride：その時間の ▲要相談 / ×受付不可。設定なし＝○空き）。
//  - GET：公開側の予約カレンダーと管理画面で使う（認証なし）。
//         ?from=ISO&to=ISO を付けるとその期間だけ返す（管理画面の週表示用。付けなければ今までどおり全件）
//  - POST / DELETE：1マスずつの変更（今の月表示 /admin/calendar 用。今までどおり）
//  - PUT：複数マスをまとめて1回で変更（週表示 /admin/calendar/week 用）
//         body: { slots: ISO文字列[], status: "OPEN" | "CONSULT" | "CLOSED" }  ※OPEN＝設定を消して○に戻す
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

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const from = sp.get("from");
    const to = sp.get("to");
    if (from && to) {
      const f = new Date(from);
      const t = new Date(to);
      if (isNaN(f.getTime()) || isNaN(t.getTime()) || t <= f || t.getTime() - f.getTime() > 62 * 24 * 3600 * 1000) {
        return NextResponse.json({ error: "Bad range" }, { status: 400 });
      }
      const overrides = await prisma.calendarOverride.findMany({
        where: { slotTime: { gte: f, lt: t } },
        select: { slotTime: true, status: true },
      });
      return NextResponse.json(overrides, { headers: { "Cache-Control": "no-store" } });
    }
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

const BULK_MAX = 500;
const BULK_STATUSES = new Set(["OPEN", "CONSULT", "CLOSED"]);

export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => null);
    const status = body?.status;
    const rawSlots: unknown = body?.slots;
    if (!BULK_STATUSES.has(status) || !Array.isArray(rawSlots) || rawSlots.length === 0 || rawSlots.length > BULK_MAX) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
    // 時刻は「その時間の0分0秒」だけ受け付ける（1マス＝1時間）。重複は1つにまとめる
    const times = new Map<number, Date>();
    for (const s of rawSlots) {
      if (typeof s !== "string") return NextResponse.json({ error: "Bad slot" }, { status: 400 });
      const d = new Date(s);
      if (isNaN(d.getTime()) || d.getUTCMinutes() !== 0 || d.getUTCSeconds() !== 0 || d.getUTCMilliseconds() !== 0) {
        return NextResponse.json({ error: "Bad slot" }, { status: 400 });
      }
      times.set(d.getTime(), d);
    }
    const slotTimes = [...times.values()];

    if (status === "OPEN") {
      // ○に戻す＝設定を消す
      const r = await prisma.calendarOverride.deleteMany({ where: { slotTime: { in: slotTimes } } });
      return NextResponse.json({ ok: true, count: slotTimes.length, deleted: r.count });
    }

    // ▲ / ×：あるものは更新、ないものは作成（2つの処理をまとめて1回の取引で）
    await prisma.$transaction([
      prisma.calendarOverride.updateMany({ where: { slotTime: { in: slotTimes } }, data: { status } }),
      prisma.calendarOverride.createMany({ data: slotTimes.map((slotTime) => ({ slotTime, status })), skipDuplicates: true }),
    ]);
    return NextResponse.json({ ok: true, count: slotTimes.length });
  } catch (error: any) {
    console.error("Calendar API PUT Error:", error);
    return NextResponse.json({ error: "Save error" }, { status: 500 });
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
