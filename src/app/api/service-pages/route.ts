// @/src/app/api/service-pages/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import sharp from "sharp";

// 認証チェック
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

// IndexNowへの通知
async function notifyIndexNow(urls: string[]) {
  const baseUrl = "https://brightofhouse.jp";
  const fullUrls = urls.map(url => `${baseUrl}${url}`);
  try {
    await fetch(`${baseUrl}/api/indexnow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: fullUrls }),
    });
  } catch (e) { console.error("IndexNow Error:", e); }
}

// R2へのアップロード (WebP変換・圧縮)
const uploadToR2 = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const webpBuffer = await sharp(buffer)
    .rotate()
    .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  
  const fileName = `ServicePages/${uuidv4()}.webp`;
  await r2Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: webpBuffer,
    ContentType: "image/webp",
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
  } catch (e) { console.error("R2 Delete Error:", e); }
};

// FAQ・お客様の声を全置き換えで同期する（保存フォームの1回の送信で完結させるため）
async function syncFaqsAndTestimonials(servicePageId: string, formData: FormData) {
  const faqsRaw = formData.get("faqs") as string | null;
  if (faqsRaw !== null) {
    const faqs = JSON.parse(faqsRaw) as { question: string; answer: string }[];
    await prisma.serviceFaq.deleteMany({ where: { servicePageId } });
    if (faqs.length > 0) {
      await prisma.serviceFaq.createMany({
        data: faqs.map((f, i) => ({
          servicePageId,
          question: f.question,
          answer: f.answer,
          order: i,
        })),
      });
    }
  }

  const testimonialsRaw = formData.get("testimonials") as string | null;
  if (testimonialsRaw !== null) {
    const testimonials = JSON.parse(testimonialsRaw) as {
      authorLabel: string; rating: number | null; body: string; isActive: boolean;
    }[];
    await prisma.testimonial.deleteMany({ where: { servicePageId } });
    if (testimonials.length > 0) {
      await prisma.testimonial.createMany({
        data: testimonials.map((t, i) => ({
          servicePageId,
          authorLabel: t.authorLabel,
          rating: t.rating ?? null,
          body: t.body,
          isActive: t.isActive,
          order: i,
        })),
      });
    }
  }
}

const bookingMenuWithSubMenusInclude = {
  subMenus: {
    include: { options: { orderBy: { order: "asc" as const } } },
    orderBy: { order: "asc" as const },
  },
};

const bookingMenuInclude = {
  bookingMenus: { include: bookingMenuWithSubMenusInclude },
  bookingCategories: { include: { menus: { include: bookingMenuWithSubMenusInclude } } },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const slug = searchParams.get("slug");
  try {
    if (id) {
      return NextResponse.json(await prisma.servicePage.findUnique({
        where: { id },
        include: { faqs: { orderBy: { order: "asc" } }, testimonials: { orderBy: { order: "asc" } }, ...bookingMenuInclude },
      }));
    }
    if (slug) {
      return NextResponse.json(await prisma.servicePage.findUnique({ where: { slug } }));
    }
    return NextResponse.json(await prisma.servicePage.findMany({ orderBy: { updatedAt: "desc" } }));
  } catch (error: any) {
    return NextResponse.json({ error: "Fetch error: " + error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const formData = await request.formData();
    const slug = formData.get("slug") as string;
    
    const exists = await prisma.servicePage.findUnique({ where: { slug } });
    if (exists) return NextResponse.json({ error: "このURLは既に使用されています" }, { status: 400 });

    let heroImageUrl = null;
    const imageFile = formData.get("heroImage") as File | null;
    if (imageFile && imageFile.size > 0) {
      heroImageUrl = await uploadToR2(imageFile);
    }

    const bookingDataRaw = formData.get("bookingData") as string;
    const bookingMenuIdsRaw = formData.get("bookingMenuIds") as string | null;
    const bookingMenuIds: string[] = bookingMenuIdsRaw ? JSON.parse(bookingMenuIdsRaw) : [];
    const bookingCategoryIdsRaw = formData.get("bookingCategoryIds") as string | null;
    const bookingCategoryIds: string[] = bookingCategoryIdsRaw ? JSON.parse(bookingCategoryIdsRaw) : [];
    const displayMenuIdsRaw = formData.get("displayMenuIds") as string | null;
    const displayMenuIds: string[] = displayMenuIdsRaw ? JSON.parse(displayMenuIdsRaw) : [];

    const newPage = await prisma.servicePage.create({
      data: {
        slug: formData.get("slug") as string,
        title: formData.get("title") as string,
        linkTitle: formData.get("linkTitle") as string,
        serviceItemId: (formData.get("serviceItemId") as string) || null,
        bookingMenus: { connect: bookingMenuIds.map((id) => ({ id })) },
        bookingCategories: { connect: bookingCategoryIds.map((id) => ({ id })) },
        displayMenuIds,
        status: formData.get("status") as string,
        catchphrase: formData.get("catchphrase") as string,
        content: ((formData.get("content") as string) || "").replace(/open="true"/g, ""),
        metaKeywords: formData.get("metaKeywords") as string,
        noIndex: formData.get("noIndex") === "true",
        showOnHome: formData.get("showOnHome") === "true",  // ← 追加
        canonicalUrl: formData.get("canonicalUrl") as string || null,
        redirectUrl: formData.get("redirectUrl") as string || null,
        cardIcon: formData.get("cardIcon") as string || null,

        metaDescription: formData.get("metaDescription") as string,
        heroImage: heroImageUrl,
        bookingData: bookingDataRaw ? JSON.parse(bookingDataRaw) : null,
      }
    });

    await syncFaqsAndTestimonials(newPage.id, formData);

    if (newPage.status === "PUBLISHED") {
      await notifyIndexNow([`/service/${newPage.slug}`]);
    }
    return NextResponse.json(newPage);
  } catch (error: any) {
    console.error("ServicePage POST Error:", error);
    return NextResponse.json({ error: "Create failed: " + error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const current = await prisma.servicePage.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let heroImageUrl = current.heroImage;
    const imageFile = formData.get("heroImage") as File | null;
    if (imageFile && imageFile.size > 0) {
      if (current.heroImage) await deleteFromR2(current.heroImage);
      heroImageUrl = await uploadToR2(imageFile);
    }

    const bookingDataRaw = formData.get("bookingData") as string;
    const bookingMenuIdsRaw = formData.get("bookingMenuIds") as string | null;
    const bookingMenuIds: string[] = bookingMenuIdsRaw ? JSON.parse(bookingMenuIdsRaw) : [];
    const bookingCategoryIdsRaw = formData.get("bookingCategoryIds") as string | null;
    const bookingCategoryIds: string[] = bookingCategoryIdsRaw ? JSON.parse(bookingCategoryIdsRaw) : [];
    const displayMenuIdsRaw = formData.get("displayMenuIds") as string | null;
    const displayMenuIds: string[] = displayMenuIdsRaw ? JSON.parse(displayMenuIdsRaw) : [];

    const updated = await prisma.servicePage.update({
      where: { id },
      data: {
        slug: formData.get("slug") as string,
        title: formData.get("title") as string,
        linkTitle: formData.get("linkTitle") as string,
        serviceItemId: (formData.get("serviceItemId") as string) || null,
        bookingMenus: { set: bookingMenuIds.map((id) => ({ id })) },
        bookingCategories: { set: bookingCategoryIds.map((id) => ({ id })) },
        displayMenuIds,
        status: formData.get("status") as string,
        catchphrase: formData.get("catchphrase") as string,
        content: ((formData.get("content") as string) || "").replace(/open="true"/g, ""),
        metaKeywords: formData.get("metaKeywords") as string,
        noIndex: formData.get("noIndex") === "true",
        showOnHome: formData.get("showOnHome") === "true",  // ← 追加
        canonicalUrl: formData.get("canonicalUrl") as string || null,
        redirectUrl: formData.get("redirectUrl") as string || null,
        cardIcon: formData.get("cardIcon") as string || null,
        metaDescription: formData.get("metaDescription") as string,
        heroImage: heroImageUrl,
        bookingData: bookingDataRaw ? JSON.parse(bookingDataRaw) : null,
      }
    });

    await syncFaqsAndTestimonials(updated.id, formData);

    if (updated.status === "PUBLISHED") {
      await notifyIndexNow([`/service/${updated.slug}`]);
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("ServicePage PUT Error:", error);
    return NextResponse.json({ error: "Update failed: " + error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await request.json();
    const target = await prisma.servicePage.findUnique({ where: { id } });
    if (target?.heroImage) await deleteFromR2(target.heroImage);
    await prisma.servicePage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Delete failed: " + error.message }, { status: 500 });
  }
}