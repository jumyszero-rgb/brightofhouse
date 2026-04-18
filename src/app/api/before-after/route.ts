// @/src/app/api/before-after/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import prisma from "@/lib/prisma";
import { r2Client } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// --- 認証チェック関数 ---
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

// --- R2へのアップロード (Sharpエラー耐性強化) ---
const uploadToR2 = async (file: File) => {
  console.log(`Starting upload for: ${file.name} (${file.size} bytes)`);
  
  // デバッグ用: 環境変数の読み込み状況を確認 (機密情報は伏せる)
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();

  console.log("R2 Debug Info:", {
    accountId: accountId ? `${accountId.slice(0, 4)}...` : "MISSING",
    bucketName: bucketName || "MISSING",
    accessKey: accessKeyId ? `${accessKeyId.slice(0, 4)}...` : "MISSING",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  let uploadBuffer = buffer;
  let contentType = file.type;
  let fileName = `Beforeandafter/${uuidv4()}`;

  try {
    const sharp = (await import("sharp")).default;
    const webpBuffer = await sharp(buffer)
      .rotate()
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    
    uploadBuffer = webpBuffer;
    contentType = "image/webp";
    fileName += ".webp";
    console.log("Sharp conversion successful");
  } catch (sharpError) {
    console.error("Sharp failed, using original file:", sharpError);
    const ext = file.name.split('.').pop() || "jpg";
    fileName += `.${ext}`;
  }
  
  if (!bucketName) {
    throw new Error("環境変数 R2_BUCKET_NAME が設定されていません");
  }

  await r2Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: uploadBuffer,
    ContentType: contentType,
  }));

  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) throw new Error("環境変数 R2_PUBLIC_URL が設定されていません");

  return `${publicUrl}/${fileName}`;
};

// GET: 一覧取得
export async function GET() {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const items = await prisma.beforeAfter.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: "DB Fetch Error: " + error.message }, { status: 500 });
  }
}

// POST: 新規登録
export async function POST(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const dateStr = formData.get("date") as string;
    const beforeFile = formData.get("beforeImage") as File;
    const afterFile = formData.get("afterImage") as File;

    if (!beforeFile || !afterFile || beforeFile.size === 0 || afterFile.size === 0) {
      return NextResponse.json({ error: "画像（Before/After両方）をアップロードしてください" }, { status: 400 });
    }

    const [beforeUrl, afterUrl] = await Promise.all([
      uploadToR2(beforeFile),
      uploadToR2(afterFile),
    ]);

    const newItem = await prisma.beforeAfter.create({
      data: {
        title,
        description,
        beforeUrl,
        afterUrl,
        createdAt: dateStr ? new Date(dateStr) : new Date(),
      },
    });

    return NextResponse.json(newItem);
  } catch (error: any) {
    console.error("POST Detailed Error:", error);
    return NextResponse.json({ error: error.message || "予期せぬエラーが発生しました" }, { status: 500 });
  }
}

// PUT: 更新
export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const dateStr = formData.get("date") as string;
    const beforeFile = formData.get("beforeImage") as File | null;
    const afterFile = formData.get("afterImage") as File | null;

    const current = await prisma.beforeAfter.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "実績が見つかりません" }, { status: 404 });

    let beforeUrl = current.beforeUrl;
    let afterUrl = current.afterUrl;

    if (beforeFile && beforeFile.size > 0) beforeUrl = await uploadToR2(beforeFile);
    if (afterFile && afterFile.size > 0) afterUrl = await uploadToR2(afterFile);

    const updated = await prisma.beforeAfter.update({
      where: { id },
      data: {
        title,
        description,
        beforeUrl,
        afterUrl,
        createdAt: dateStr ? new Date(dateStr) : current.createdAt,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT Detailed Error:", error);
    return NextResponse.json({ error: error.message || "更新に失敗しました" }, { status: 500 });
  }
}

// DELETE: 削除
export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await request.json();
    await prisma.beforeAfter.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
