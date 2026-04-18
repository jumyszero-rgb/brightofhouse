// @/src/app/api/videos/route.ts
import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client"; // ← 削除
import prisma from "@/lib/prisma"; // ← 追加
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/s3";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import fs from "fs";

const execAsync = promisify(exec);
// const prisma = new PrismaClient(); // ← 削除

// 認証チェック
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

// 一時ディレクトリの確保
const TMP_DIR = "/tmp";
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR);
}

// GET: 動画一覧取得
export async function GET() {
  try {
    const videos = await prisma.promotionVideo.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(videos);
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// POST: 動画アップロード＆圧縮
export async function POST(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const deviceType = formData.get("deviceType") as string; // "pc" or "mobile"

    if (!file || !deviceType) {
      return NextResponse.json({ error: "ファイルとデバイスタイプは必須です" }, { status: 400 });
    }

    // 1. 一時ファイルとして保存
    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = `${uuidv4()}_original.mp4`;
    const compressedName = `${uuidv4()}_compressed.mp4`;
    const originalPath = join(TMP_DIR, originalName);
    const compressedPath = join(TMP_DIR, compressedName);

    await writeFile(originalPath, buffer);

    // 2. FFmpegで圧縮
    // PC用: 横幅1280px, スマホ用: 横幅720px にリサイズ
    // CRF 28 (画質と軽さのバランス)
    const scale = deviceType === "pc" ? "1280:-2" : "720:-2";
    const command = `ffmpeg -i ${originalPath} -vf scale=${scale} -c:v libx264 -crf 28 -c:a aac -b:a 128k ${compressedPath}`;

    console.log("Compressing video...", command);
    await execAsync(command);
    console.log("Compression finished.");

    // 3. 圧縮後のファイルをR2にアップロード
    const compressedFileBuffer = await fs.promises.readFile(compressedPath);
    const r2Key = `videos/${compressedName}`;

    await r2Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: r2Key,
      Body: compressedFileBuffer,
      ContentType: "video/mp4",
    }));

    const videoUrl = `${process.env.R2_PUBLIC_URL}/${r2Key}`;

    // 4. DBに保存
    const newVideo = await prisma.promotionVideo.create({
      data: {
        title: title || "無題",
        videoUrl,
        deviceType,
      },
    });

    // 5. お掃除（一時ファイル削除）
    await Promise.all([
      unlink(originalPath).catch(() => {}),
      unlink(compressedPath).catch(() => {}),
    ]);

    return NextResponse.json(newVideo);

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// DELETE: 動画削除
export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    const video = await prisma.promotionVideo.findUnique({ where: { id } });

    if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // R2から削除
    const key = video.videoUrl.replace(`${process.env.R2_PUBLIC_URL}/`, "");
    await r2Client.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }));

    // DBから削除
    await prisma.promotionVideo.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}