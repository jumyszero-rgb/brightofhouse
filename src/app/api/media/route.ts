// @/src/app/api/media/route.ts
// R2 メディア管理API（DBを使わず、R2バケットを直接一覧・アップロード・削除する）
// GET   : バケット内の画像を一覧（?prefix= で絞り込み / ?token= で続き）
// POST  : 画像アップロード（sharpでWebP変換） → Media/<uuid>.webp
// DELETE: { key } を指定してR2から削除
import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
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
  } catch {
    return false;
  }
}

const IMAGE_EXT = /\.(webp|png|jpe?g|gif|avif|svg)$/i;

// GET: 一覧
export async function GET(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("prefix") || undefined;
    const token = searchParams.get("token") || undefined;
    const base = process.env.R2_PUBLIC_URL;

    const res = await r2Client.send(new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: 1000,
      ContinuationToken: token,
    }));

    const items = (res.Contents || [])
      .filter((o) => o.Key && IMAGE_EXT.test(o.Key))
      .map((o) => ({
        key: o.Key as string,
        url: `${base}/${o.Key}`,
        size: o.Size || 0,
        lastModified: o.LastModified ? new Date(o.LastModified).toISOString() : null,
      }))
      // 新しい順
      .sort((a, b) => (b.lastModified || "").localeCompare(a.lastModified || ""));

    // 先頭階層（フォルダ相当のプレフィックス）を抽出してフィルタUIに使う
    const folders = Array.from(
      new Set(
        (res.Contents || [])
          .map((o) => o.Key || "")
          .filter((k) => k.includes("/"))
          .map((k) => k.split("/")[0])
      )
    ).sort();

    return NextResponse.json({
      items,
      nextToken: res.IsTruncated ? res.NextContinuationToken : null,
      folders,
    });
  } catch (error) {
    console.error("media list error", error);
    return NextResponse.json({ error: "List failed" }, { status: 500 });
  }
}

// POST: アップロード
export async function POST(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "File required" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const webpBuffer = await sharp(buffer)
      .rotate()
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const fileName = `Media/${uuidv4()}.webp`;
    await r2Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: webpBuffer,
      ContentType: "image/webp",
    }));

    return NextResponse.json({
      key: fileName,
      url: `${process.env.R2_PUBLIC_URL}/${fileName}`,
    });
  } catch (error) {
    console.error("media upload error", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// DELETE: 削除
export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { key } = await request.json();
    if (!key || typeof key !== "string" || key.startsWith("/")) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }
    await r2Client.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("media delete error", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
