// @/src/app/api/lead/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { sendLeadNotification, sendLeadConfirmationToUser, LeadData } from "@/lib/leadMail";

/**
 * LPの軽量リードフォーム送信先。
 * 予約テーブル（/api/booking）はカレンダー前提のため使わず、
 * ここではDBに書かずに通知メールのみ送る（カレンダーを汚さない・移行不要）。
 * ※リードをDBに残したくなったら、別途 Lead モデルを追加して create する。
 */

const MAX_PHOTOS = 5;

const uploadPhoto = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const webpBuffer = await sharp(buffer)
    .rotate()
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const fileName = `Lead_Photos/${uuidv4()}.webp`;
  await r2Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: webpBuffer,
    ContentType: "image/webp",
  }));
  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const str = (k: string) => ((formData.get(k) as string) || "").trim();

    const name = str("name");
    const phone = str("phone");
    const service = str("service") || "お問い合わせ";

    if (!name || !phone) {
      return NextResponse.json(
        { error: "お名前と電話番号は必須です" },
        { status: 400 }
      );
    }

    const photoFiles = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, MAX_PHOTOS);
    const photoUrls = await Promise.all(photoFiles.map(uploadPhoto));

    const lead: LeadData = {
      name,
      phone,
      service,
      email: str("email"),
      zip: str("zip"),
      address: str("address"),
      timing: str("timing"),
      area: str("area"),
      contactMethod: str("contactMethod"),
      notes: str("notes"),
      source: str("source"),
      photoUrls,
      // 流入元（フォームから同送。無ければ空）
      gclid: str("gclid"),
      utm_source: str("utm_source"),
      utm_medium: str("utm_medium"),
      utm_campaign: str("utm_campaign"),
      utm_term: str("utm_term"),
      utm_content: str("utm_content"),
      landingUrl: str("landingUrl"),
    };

    // お客様への自動返信を先に“待って”送り、結果を管理者通知に載せる。
    // （以前は待たずに送っていたため、失敗してもサーバーログにしか残らなかった）
    // 自動返信が失敗してもお客様の送信自体は成功扱いにする。
    let confirmStatus = "メール未入力のため送信なし";
    if (lead.email) {
      try {
        await sendLeadConfirmationToUser(lead);
        confirmStatus = `送信済み（${lead.email}）`;
      } catch (err: any) {
        console.error("Lead confirmation mail error:", err);
        confirmStatus = `送信失敗（${lead.email}）: ${String(err?.message || err).slice(0, 200)}`;
      }
    }

    // 管理者通知は失敗させたくないので待つ。
    await sendLeadNotification(lead, confirmStatus);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Lead POST Error:", error?.message);
    return NextResponse.json({ error: "送信に失敗しました" }, { status: 500 });
  }
}
