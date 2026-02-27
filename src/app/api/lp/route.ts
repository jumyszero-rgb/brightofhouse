// @/src/app/api/lp/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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

const uploadToR2 = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const webpBuffer = await sharp(buffer)
    .rotate()
    .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const fileName = `LP/${uuidv4()}.webp`;
  await r2Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: webpBuffer,
    ContentType: "image/webp",
  }));
  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
};

const deleteFromR2 = async (url: string) => {
  if (!url) return;
  try {
    const key = url.replace(`${process.env.R2_PUBLIC_URL}/`, "");
    await r2Client.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }));
  } catch (e) {
    console.error(e);
  }
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  try {
    if (id) {
      const lp = await prisma.landingPage.findUnique({ where: { id } });
      return NextResponse.json(lp);
    }
    const lps = await prisma.landingPage.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(lps);
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const formData = await request.formData();
    const slug = formData.get("slug") as string;
    
    const exists = await prisma.landingPage.findUnique({ where: { slug } });
    if (exists) return NextResponse.json({ error: "Used slug" }, { status: 400 });

    let heroImageUrl = null;
    const imageFile = formData.get("heroImage") as File | null;
    if (imageFile && imageFile.size > 0) {
      heroImageUrl = await uploadToR2(imageFile);
    }

    const newLp = await prisma.landingPage.create({
      data: {
        slug,
        title: formData.get("title") as string,
        status: formData.get("status") as string,
        showOnHome: formData.get("showOnHome") === "true",
        catchphrase: formData.get("catchphrase") as string,
        subCopy: formData.get("subCopy") as string,
        content: formData.get("content") as string,
        ctaText: formData.get("ctaText") as string,
        ctaLink: formData.get("ctaLink") as string,
        heroImage: heroImageUrl,
      }
    });
    return NextResponse.json(newLp);
  } catch (error) {
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const slug = formData.get("slug") as string;

    const currentLp = await prisma.landingPage.findUnique({ where: { id } });
    if (!currentLp) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let heroImageUrl = currentLp.heroImage;
    const imageFile = formData.get("heroImage") as File | null;
    if (imageFile && imageFile.size > 0) {
      if (currentLp.heroImage) await deleteFromR2(currentLp.heroImage);
      heroImageUrl = await uploadToR2(imageFile);
    }

    const updatedLp = await prisma.landingPage.update({
      where: { id },
      data: {
        slug,
        title: formData.get("title") as string,
        status: formData.get("status") as string,
        showOnHome: formData.get("showOnHome") === "true",
        catchphrase: formData.get("catchphrase") as string,
        subCopy: formData.get("subCopy") as string,
        content: formData.get("content") as string,
        ctaText: formData.get("ctaText") as string,
        ctaLink: formData.get("ctaLink") as string,
        heroImage: heroImageUrl,
      }
    });
    return NextResponse.json(updatedLp);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await request.json();
    const lp = await prisma.landingPage.findUnique({ where: { id } });
    if (lp?.heroImage) await deleteFromR2(lp.heroImage);
    await prisma.landingPage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}