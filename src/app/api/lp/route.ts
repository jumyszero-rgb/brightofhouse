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
  } catch { return false; }
}

async function notifyIndexNow(urls: string[]) {
  const baseUrl = "https://brightofhouse.jp";
  const fullUrls = urls.map(url => `${baseUrl}${url}`);
  try {
    const response = await fetch(`${baseUrl}/api/indexnow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: fullUrls }),
    });
  } catch (e) { console.error(e); }
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
  } catch (e) { console.error(e); }
};

// リッチLPテンプレート用のJSON配列フィールドをformDataから読み取る（空/不正な場合はnull）
const parseJsonField = (formData: FormData, key: string) => {
  const raw = formData.get(key) as string | null;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length === 0 ? null : parsed;
  } catch {
    return null;
  }
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const slug = searchParams.get("slug");

  try {
    if (id) {
      const subMenusInclude = {
        subMenus: {
          include: { options: { orderBy: { order: "asc" as const } } },
          orderBy: { order: "asc" as const },
        },
      };
      const lp = await prisma.landingPage.findUnique({
        where: { id },
        include: {
          bookingMenus: { include: subMenusInclude },
          bookingCategories: { include: { menus: { include: subMenusInclude } } },
          beforeAfters: { orderBy: { createdAt: "desc" as const } },
        },
      });
      return NextResponse.json(lp);
    }
    // slugで検索する場合、categoryを限定せず、一致するものを返すように修正
    if (slug) {
      const lp = await prisma.landingPage.findUnique({ where: { slug } });
      return NextResponse.json(lp);
    }

    const lps = await prisma.landingPage.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(lps);
  } catch (error) { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const formData = await request.formData();
    const slug = formData.get("slug") as string;

    // 複製時など、新規アップロードなしで既存の画像URLをそのまま引き継ぎたい場合に使用
    let heroImageUrl = (formData.get("existingHeroImage") as string | null) || null;
    const imageFile = formData.get("heroImage") as File | null;
    if (imageFile && imageFile.size > 0) {
      heroImageUrl = await uploadToR2(imageFile);
    }

    const bookingMenuIdsRaw = formData.get("bookingMenuIds") as string | null;
    const bookingMenuIds: string[] = bookingMenuIdsRaw ? JSON.parse(bookingMenuIdsRaw) : [];
    const bookingCategoryIdsRaw = formData.get("bookingCategoryIds") as string | null;
    const bookingCategoryIds: string[] = bookingCategoryIdsRaw ? JSON.parse(bookingCategoryIdsRaw) : [];
    const beforeAfterIdsRaw = formData.get("beforeAfterIds") as string | null;
    const beforeAfterIds: string[] = beforeAfterIdsRaw ? JSON.parse(beforeAfterIdsRaw) : [];

    const newLp = await prisma.landingPage.create({
      data: {
        slug,
        title: formData.get("title") as string,
        linkTitle: formData.get("linkTitle") as string,
        status: formData.get("status") as string,
        category: (formData.get("category") as string) || "CAMPAIGN",
        showOnHome: formData.get("showOnHome") === "true",
        catchphrase: formData.get("catchphrase") as string,
        subCopy: formData.get("subCopy") as string,
        content: ((formData.get("content") as string) || "").replace(/open="true"/g, ""),
        ctaText: formData.get("ctaText") as string,
        ctaLink: formData.get("ctaLink") as string,
        heroImage: heroImageUrl,
        // ▼ 追加
        metaKeywords: formData.get("metaKeywords") as string,
        metaDescription: formData.get("metaDescription") as string,
        showBottomCta: formData.get("showBottomCta") !== "false",
        noIndex: formData.get("noIndex") === "true",
        canonicalUrl: formData.get("canonicalUrl") as string || null,
        bookingMenus: { connect: bookingMenuIds.map((id) => ({ id })) },
        bookingCategories: { connect: bookingCategoryIds.map((id) => ({ id })) },
        bookingData: (() => {
          const raw = formData.get("bookingData") as string;
          return raw ? JSON.parse(raw) : null;
        })(),
        // ▼ リッチLPテンプレート
        templateStyle: (formData.get("templateStyle") as string) || "SIMPLE",
        heroEyebrow: (formData.get("heroEyebrow") as string) || null,
        heroSubtitle: (formData.get("heroSubtitle") as string) || null,
        heroPriceLead: (formData.get("heroPriceLead") as string) || null,
        serviceLabel: (formData.get("serviceLabel") as string) || null,
        menuIntro: (formData.get("menuIntro") as string) || null,
        campaignBadge: (formData.get("campaignBadge") as string) || null,
        setNote: (formData.get("setNote") as string) || null,
        pains: parseJsonField(formData, "pains"),
        menuItems: parseJsonField(formData, "menuItems"),
        menuOptions: parseJsonField(formData, "menuOptions"),
        baseWork: parseJsonField(formData, "baseWork"),
        recommended: parseJsonField(formData, "recommended"),
        reasons: parseJsonField(formData, "reasons"),
        faqItems: parseJsonField(formData, "faqItems"),
        voices: parseJsonField(formData, "voices"),
        beforeAfters: { connect: beforeAfterIds.map((id) => ({ id })) },
      }
    });
    if (newLp.status === "PUBLISHED") {
      await notifyIndexNow([`/${newLp.category === "AREA" ? "area" : "lp"}/${newLp.slug}`]);
    }
    return NextResponse.json(newLp);
  } catch (error) { return NextResponse.json({ error: "Create failed" }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const currentLp = await prisma.landingPage.findUnique({ where: { id } });
    if (!currentLp) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let heroImageUrl = currentLp.heroImage;
    const imageFile = formData.get("heroImage") as File | null;
    if (imageFile && imageFile.size > 0) {
      if (currentLp.heroImage) await deleteFromR2(currentLp.heroImage);
      heroImageUrl = await uploadToR2(imageFile);
    }

    const bookingMenuIdsRaw = formData.get("bookingMenuIds") as string | null;
    const bookingMenuIds: string[] = bookingMenuIdsRaw ? JSON.parse(bookingMenuIdsRaw) : [];
    const bookingCategoryIdsRaw = formData.get("bookingCategoryIds") as string | null;
    const bookingCategoryIds: string[] = bookingCategoryIdsRaw ? JSON.parse(bookingCategoryIdsRaw) : [];
    const beforeAfterIdsRaw = formData.get("beforeAfterIds") as string | null;
    const beforeAfterIds: string[] = beforeAfterIdsRaw ? JSON.parse(beforeAfterIdsRaw) : [];

    const updatedLp = await prisma.landingPage.update({
      where: { id },
      data: {
        slug: formData.get("slug") as string,
        title: formData.get("title") as string,
        linkTitle: formData.get("linkTitle") as string,
        status: formData.get("status") as string,
        category: (formData.get("category") as string) || "CAMPAIGN",
        showOnHome: formData.get("showOnHome") === "true",
        catchphrase: formData.get("catchphrase") as string,
        subCopy: formData.get("subCopy") as string,
        content: ((formData.get("content") as string) || "").replace(/open="true"/g, ""),
        ctaText: formData.get("ctaText") as string,
        ctaLink: formData.get("ctaLink") as string,
        heroImage: heroImageUrl,
        // ▼ 追加
        metaKeywords: formData.get("metaKeywords") as string,
        metaDescription: formData.get("metaDescription") as string,
        showBottomCta: formData.get("showBottomCta") !== "false",
        noIndex: formData.get("noIndex") === "true",
        canonicalUrl: formData.get("canonicalUrl") as string || null,
        bookingMenus: { set: bookingMenuIds.map((id) => ({ id })) },
        bookingCategories: { set: bookingCategoryIds.map((id) => ({ id })) },
        bookingData: (() => {
          const raw = formData.get("bookingData") as string;
          return raw ? JSON.parse(raw) : null;
        })(),
        // ▼ リッチLPテンプレート
        templateStyle: (formData.get("templateStyle") as string) || "SIMPLE",
        heroEyebrow: (formData.get("heroEyebrow") as string) || null,
        heroSubtitle: (formData.get("heroSubtitle") as string) || null,
        heroPriceLead: (formData.get("heroPriceLead") as string) || null,
        serviceLabel: (formData.get("serviceLabel") as string) || null,
        menuIntro: (formData.get("menuIntro") as string) || null,
        campaignBadge: (formData.get("campaignBadge") as string) || null,
        setNote: (formData.get("setNote") as string) || null,
        pains: parseJsonField(formData, "pains"),
        menuItems: parseJsonField(formData, "menuItems"),
        menuOptions: parseJsonField(formData, "menuOptions"),
        baseWork: parseJsonField(formData, "baseWork"),
        recommended: parseJsonField(formData, "recommended"),
        reasons: parseJsonField(formData, "reasons"),
        faqItems: parseJsonField(formData, "faqItems"),
        voices: parseJsonField(formData, "voices"),
        beforeAfters: { set: beforeAfterIds.map((id) => ({ id })) },
      }
    });
    if (updatedLp.status === "PUBLISHED") {
      await notifyIndexNow([`/${updatedLp.category === "AREA" ? "area" : "lp"}/${updatedLp.slug}`]);
    }
    return NextResponse.json(updatedLp);
  } catch (error) { return NextResponse.json({ error: "Update failed" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await request.json();
    const lp = await prisma.landingPage.findUnique({ where: { id } });
    if (!lp) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (lp.heroImage) await deleteFromR2(lp.heroImage);
    await prisma.landingPage.delete({ where: { id } });
    await notifyIndexNow([`/${lp.category === "AREA" ? "area" : "lp"}/${lp.slug}`]);
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: "Delete failed" }, { status: 500 }); }
}