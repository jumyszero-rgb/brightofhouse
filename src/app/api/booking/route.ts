// @/src/app/api/booking/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sendBookingNotification, sendBookingConfirmationToUser } from "@/lib/mail";
import { resolveCampaignName, resolveAdGroupName } from "@/lib/campaignNames";

// 空き枠取得（以前は申し込みのあった時間を自動で×にしていた）。
// 2026-10 仕様変更：申し込みがあっても自動で×にしない（×・▲は管理画面「カレンダー空き枠設定」で手動）。
// 申し込み自体もデータベースに保存しなくなったため、常に空の一覧を返す（古い画面からの呼び出しでも壊れないように残す）。
export async function GET() {
  return NextResponse.json([]);
}

// 文字列だけを短く取り出す（流入元フィールド用）
const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// 仮予約の作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 2026-10 仕様変更：申し込み（お名前・連絡先・住所・備考などの個人情報を含む）は、データベースに保存しない。
    // 内容は担当者への通知メールと、お客様への控えメールにだけ使う（このサーバーには残さない）。
    const name = str(body.name, 100);
    const email = str(body.email, 200);
    const phone = str(body.tel || body.phone, 50);
    if (!name || !phone || !email) return NextResponse.json({ error: "必須項目が足りません" }, { status: 400 });
    // 日時：タイムゾーンの付いていない値（"2026-10-25T10:00:00"）は日本時間として読む。「Z」などが付いていればそのまま
    const toDate = (v: unknown) => {
      const t = String(v || "");
      return new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(t) ? t : t + "+09:00");
    };
    const startTime = toDate(body.startTime);
    const endTime = toDate(body.endTime);
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return NextResponse.json({ error: "日時が正しくありません" }, { status: 400 });
    const booking = {
      id: randomUUID(), // 計測（問い合わせ行動の記録）で同じ申し込みを見分けるためだけの番号。個人情報とは結び付けて保存しない
      createdAt: new Date(),
      category: str(body.category, 200),
      customerName: name,
      email,
      phone,
      address: str(body.address, 300),
      notes: str(body.notes, 2000),
      startTime,
      endTime,
      status: "PENDING",
      items: str(body.items, 5000) || "未選択",
      totalPrice: Number(body.totalPrice) || 0,
      totalMinutes: Number(body.totalMinutes) || 60,
    };

    const mailData = {
      ...booking,
      zip: body.zip || "",
      contactMethod: body.contactMethod || "未指定",
      totalMinutesDisplay: body.totalMinutes || "未定",
      dateUndecided: !!body.dateUndecided,
      inquiryOnly: !!body.inquiryOnly,
      // 流入元（DBには保存せず、管理者通知メールにだけ載せる）
      source: {
        gclid: str(body.gclid),
        utm_source: str(body.utm_source),
        utm_medium: str(body.utm_medium),
        utm_campaign: str(body.utm_campaign),
        utm_term: str(body.utm_term),
        utm_content: str(body.utm_content),
        landingUrl: str(body.landingUrl),
        pagePath: str(body.pagePath),
        referrer: str(body.referrer),
        gbraid: str(body.gbraid),
        wbraid: str(body.wbraid),
        kw: str(body.kw),
        mt: str(body.mt),
        campaignName: await resolveCampaignName(str(body.cid)),
        adGroupName: await resolveAdGroupName(str(body.ag), str(body.asg)),
      },
    };

    // データベースに残さないので、担当者への通知メールは送れたことを確認してから「受け付けました」を返す
    // （送れなかったときはお客様に再送信・電話をお願いできるよう、エラーを返す）
    try {
      await sendBookingNotification(mailData);
    } catch (err) {
      console.error("Admin Email notification error:", err);
      return NextResponse.json({ error: "送信に失敗しました。お手数ですが時間をおいて再度お試しいただくか、お電話でご連絡ください。" }, { status: 502 });
    }
    sendBookingConfirmationToUser(mailData).catch(err => console.error("User Email notification error:", err));

    // 返すのは受付番号だけ（個人情報は返さない）
    return NextResponse.json({ ok: true, id: booking.id });


  } catch (error: any) {
    console.error("Booking POST Error:", error.message);
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}
