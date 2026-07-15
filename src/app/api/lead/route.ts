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

    const name = ((formData.get("name") as string) || "").trim();
    const phone = ((formData.get("phone") as string) || "").trim();
    const service = ((formData.get("service") as string) || "お問い合わせ").trim();

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
      email: ((formData.get("email") as string) || "").trim(),
      zip: ((formData.get("zip") as string) || "").trim(),
      address: ((formData.get("address") as string) || "").trim(),
      timing: ((formData.get("timing") as string) || "").trim(),
      area: ((formData.get("area") as string) || "").trim(),
      contactMethod: ((formData.get("contactMethod") as string) || "").trim(),
      notes: ((formData.get("notes") as string) || "").trim(),
      source: ((formData.get("source") as string) || "").trim(),
      photoUrls,
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
