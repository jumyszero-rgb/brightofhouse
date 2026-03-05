// @/src/app/api/lp/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import sharp from "sharp";

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

export async function POST(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) return NextResponse.json({ error: "No image" }, { status: 400 });

    // SharpでWebP変換 & 最適化
    const buffer = Buffer.from(await file.arrayBuffer());
    const webpBuffer = await sharp(buffer)
      .rotate()
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75 }) // 本文内なので少し軽めに設定
      .toBuffer();

    const fileName = `LP_Content/${uuidv4()}.webp`;

    await r2Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: webpBuffer,
      ContentType: "image/webp",
    }));

    return NextResponse.json({ url: `${process.env.R2_PUBLIC_URL}/${fileName}` });
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}