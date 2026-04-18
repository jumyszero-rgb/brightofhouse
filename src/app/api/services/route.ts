// @/src/app/api/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

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

async function notifyIndexNow(urls: string[]) {
  const baseUrl = process.env.BASE_URL || "https://brightofhouse.jp";
  const fullUrls = urls.map(url => `${baseUrl}${url}`);

  try {
    const response = await fetch(`${baseUrl}/api/indexnow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: fullUrls }),
    });
    if (!response.ok) {
      console.error("Failed to notify IndexNow:", await response.text());
    } else {
      console.log("Successfully notified IndexNow for:", fullUrls);
    }
  } catch (error) {
    console.error("Error notifying IndexNow:", error);
  }
}

export async function GET() {
  try {
    const data = await prisma.serviceCategory.findMany({
      include: {
        items: {
          include: { 
            details: { orderBy: { order: "asc" } },
            options: { orderBy: { price: "desc" } } // オプションも取得
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    const body = await request.json();
    
    if (body.type === "category") {
      const res = await prisma.serviceCategory.create({
        data: { title: body.title, order: body.order },
      });
      await notifyIndexNow(['/service', '/service2', '/booking']);
      return NextResponse.json(res);
    }
    
    if (body.type === "item") {
      const res = await prisma.serviceItem.create({
        data: { 
          title: body.title, 
          subTitle: body.subTitle,
          regularPrice: body.regularPrice,
          discountPrice: body.discountPrice,
          basePrice: Number(body.basePrice) || 0,
          estimatedMinutes: Number(body.estimatedMinutes) || 60,
          notes: body.notes,
          categoryId: body.categoryId,
          order: body.order 
        },
      });
      await notifyIndexNow(['/service', '/service2', '/booking']);
      return NextResponse.json(res);
    }

    if (body.type === "detail") {
      const res = await prisma.serviceDetail.create({
        data: {
          label: body.label,
          value: body.value,
          isPrice: body.isPrice,
          isNote: body.isNote,
          labelColor: body.labelColor || "default",
          labelSize: body.labelSize || "sm",
          labelAlign: body.labelAlign || "left",
          valueColor: body.valueColor || "default",
          valueSize: body.valueSize || "base",
          valueAlign: body.valueAlign || "right",
          itemId: body.itemId,
          order: body.order,
        },
      });
      await notifyIndexNow(['/service', '/service2']);
      return NextResponse.json(res);
    }

    if (body.type === "option") {
      const res = await prisma.serviceOption.create({
        data: {
          title: body.title,
          subTitle: body.subTitle, 
          regularPrice: body.regularPrice, 
          price: Number(body.price) || 0,
          additionalMinutes: Number(body.additionalMinutes) || 0,
          // ▼ 追加: 欠落していた割引・リンク情報の保存処理
          discountType: body.discountType || "NONE",
          discountValue: Number(body.discountValue) || 0,
          linkedItemId: body.linkedItemId || null,
          itemId: body.itemId
        }
      });
      await notifyIndexNow(['/service', '/service2', '/booking']);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    const body = await request.json();
    const { type, id, ...data } = body;

    if (type === "category") {
      const res = await prisma.serviceCategory.update({
        where: { id },
        data: { title: data.title, order: data.order },
      });
      await notifyIndexNow(['/service', '/service2', '/booking']);
      return NextResponse.json(res);
    }

    if (type === "item") {
      const res = await prisma.serviceItem.update({
        where: { id },
        data: { 
          title: data.title, 
          subTitle: data.subTitle,
          regularPrice: data.regularPrice,
          discountPrice: data.discountPrice,
          basePrice: Number(data.basePrice) || 0,
          estimatedMinutes: Number(data.estimatedMinutes) || 60,
          notes: data.notes,
          order: data.order 
        },
      });
      await notifyIndexNow(['/service', '/service2', '/booking']);
      return NextResponse.json(res);
    }

    if (type === "detail") {
      const res = await prisma.serviceDetail.update({
        where: { id },
        data: {
          label: data.label,
          value: data.value,
          isPrice: data.isPrice,
          isNote: data.isNote,
          labelColor: data.labelColor,
          labelSize: data.labelSize,
          labelAlign: data.labelAlign,
          valueColor: data.valueColor,
          valueSize: data.valueSize,
          valueAlign: data.valueAlign,
          order: data.order
        },
      });
      await notifyIndexNow(['/service', '/service2']);
      return NextResponse.json(res);
    }

    if (type === "option") {
      const res = await prisma.serviceOption.update({
        where: { id },
        data: {
          title: data.title,
          subTitle: data.subTitle,
          regularPrice: data.regularPrice,
          price: Number(data.price) || 0,
          additionalMinutes: Number(data.additionalMinutes) || 0,
          // ▼ 追加: 欠落していた割引・リンク情報の更新処理
          discountType: data.discountType || "NONE",
          discountValue: Number(data.discountValue) || 0,
          linkedItemId: data.linkedItemId || null,
        }
      });
      await notifyIndexNow(['/service', '/service2', '/booking']);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    const { id, type } = await request.json();
    
    if (type === "category") {
      await prisma.serviceCategory.delete({ where: { id } });
    } else if (type === "item") {
      await prisma.serviceItem.delete({ where: { id } });
    } else if (type === "detail") {
      await prisma.serviceDetail.delete({ where: { id } });
    } else if (type === "option") {
      await prisma.serviceOption.delete({ where: { id } });
    }
    
    await notifyIndexNow(['/service', '/service2', '/booking']);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}