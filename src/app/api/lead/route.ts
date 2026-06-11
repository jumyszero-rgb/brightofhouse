// @/src/app/api/lead/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendLeadNotification, sendLeadConfirmationToUser, LeadData } from "@/lib/leadMail";

/**
 * LPの軽量リードフォーム送信先。
 * 予約テーブル（/api/booking）はカレンダー前提のため使わず、
 * ここではDBに書かずに通知メールのみ送る（カレンダーを汚さない・移行不要）。
 * ※リードをDBに残したくなったら、別途 Lead モデルを追加して create する。
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<LeadData>;

    const name = (body.name || "").trim();
    const phone = (body.phone || "").trim();
    const service = (body.service || "お問い合わせ").trim();

    if (!name || !phone) {
      return NextResponse.json(
        { error: "お名前と電話番号は必須です" },
        { status: 400 }
      );
    }

    const lead: LeadData = {
      name,
      phone,
      service,
      email: body.email?.trim() || "",
      zip: body.zip?.trim() || "",
      address: body.address?.trim() || "",
      timing: body.timing?.trim() || "",
      area: body.area?.trim() || "",
      contactMethod: body.contactMethod?.trim() || "",
      notes: body.notes?.trim() || "",
      source: body.source?.trim() || "",
    };

    // 管理者通知は失敗させたくないので待つ。自動返信は失敗してもユーザー成功扱い。
    await sendLeadNotification(lead);
    sendLeadConfirmationToUser(lead).catch((err) =>
      console.error("Lead confirmation mail error:", err)
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Lead POST Error:", error?.message);
    return NextResponse.json({ error: "送信に失敗しました" }, { status: 500 });
  }
}
