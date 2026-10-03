// @/src/app/api/service-features/route.ts
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

export async function GET() {
  try {
    const rows = await prisma.serviceFeature.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    const created = await prisma.serviceFeature.create({
      data: {
        title: b.title || "新しい分野",
        description: b.description || "",
        color: b.color || null,
        imageUrl: b.imageUrl || null,
        link: b.link || null,
        order: typeof b.order === "number" ? b.order : 0,
      },
    });
    return NextResponse.json(created);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    const updated = await prisma.serviceFeature.update({
      where: { id: b.id },
      data: {
        title: b.title,
        description: b.description ?? "",
        color: b.color || null,
        imageUrl: b.imageUrl ?? undefined,
        link: b.link || null,
        order: typeof b.order === "number" ? b.order : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await request.json();
    await prisma.serviceFeature.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
