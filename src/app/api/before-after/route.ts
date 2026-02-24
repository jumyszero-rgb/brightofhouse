// @/src/app/api/before-after/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import prisma from "@/lib/prisma"; // ← 追加
import { r2Client } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import sharp from "sharp"; // 追加

// const prisma = new PrismaClient(); // ← 削除

// --- 認証チェック関数 ---
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

// --- ヘルパー関数 ---

// R2へのアップロード (WebP変換・圧縮付き)
const uploadToR2 = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // SharpでWebP変換 & 圧縮 & リサイズ
  const webpBuffer = await sharp(buffer)
    .rotate() // Exif情報に基づいて回転を自動補正（スマホ写真対策）
    .resize(1920, 1920, { // 最大サイズ制限（4Kなどは無駄なのでFHD程度に）
      fit: "inside",      // 比率維持で枠内に収める
      withoutEnlargement: true // 元が小さい場合は拡大しない
    })
    .webp({ quality: 80 }) // 画質80%でWebP化（十分綺麗で軽い）
    .toBuffer();

  // ファイル名を生成（拡張子は .webp 固定）
  const fileName = `Beforeandafter/${uuidv4()}.webp`;
  
  await r2Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: webpBuffer,
    ContentType: "image/webp", // MIMEタイプもWebPに
  }));

  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
};

// R2からの削除
const deleteFromR2 = async (url: string) => {
  if (!url) return;
  try {
    const key = url.replace(`${process.env.R2_PUBLIC_URL}/`, "");
    await r2Client.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }));
  } catch (e) {
    console.error("R2 delete error:", e);
  }
};

// --- APIハンドラ ---

// GET: 一覧取得
export async function GET() {
  // ※公開ページ(Server Component)からのアクセスは認証なしで通す必要があるため、
  // ここでは認証チェックを外すか、もしくは「管理画面用API」と「公開用データ取得」を分けるのがベストですが、
  // 現状の構成（公開ページは直接Prismaを叩いている）なら、このAPIは管理画面専用としてロックしてOKです。
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await prisma.beforeAfter.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST: 新規登録
export async function POST(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const dateStr = formData.get("date") as string;
    const beforeFile = formData.get("beforeImage") as File;
    const afterFile = formData.get("afterImage") as File;

    if (!beforeFile || !afterFile) {
      return NextResponse.json({ error: "画像が必要です" }, { status: 400 });
    }

    const createdAt = dateStr ? new Date(dateStr) : new Date();

    // 並列でアップロード（WebP変換含む）
    const [beforeUrl, afterUrl] = await Promise.all([
      uploadToR2(beforeFile),
      uploadToR2(afterFile),
    ]);

    const newItem = await prisma.beforeAfter.create({
      data: { title, description, beforeUrl, afterUrl, createdAt },
    });

    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// PUT: 更新
export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const dateStr = formData.get("date") as string;
    const beforeFile = formData.get("beforeImage") as File | null;
    const afterFile = formData.get("afterImage") as File | null;

    const currentItem = await prisma.beforeAfter.findUnique({ where: { id } });
    if (!currentItem) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let beforeUrl = currentItem.beforeUrl;
    let afterUrl = currentItem.afterUrl;

    if (beforeFile && beforeFile.size > 0) {
      await deleteFromR2(currentItem.beforeUrl);
      beforeUrl = await uploadToR2(beforeFile);
    }
    if (afterFile && afterFile.size > 0) {
      await deleteFromR2(currentItem.afterUrl);
      afterUrl = await uploadToR2(afterFile);
    }

    const updatedItem = await prisma.beforeAfter.update({
      where: { id },
      data: {
        title,
        description,
        createdAt: dateStr ? new Date(dateStr) : currentItem.createdAt,
        beforeUrl,
        afterUrl,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE: 削除
export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    
    const item = await prisma.beforeAfter.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await Promise.all([
      deleteFromR2(item.beforeUrl),
      deleteFromR2(item.afterUrl),
    ]);

    await prisma.beforeAfter.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}