import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const BLOCK_MINUTES = 10080;

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

// GET: IP制限チェック
export async function GET(req: NextRequest) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "main" } });
  const ipBlockEnabled = settings?.reviewIpBlock ?? true;

  if (!ipBlockEnabled) {
    return NextResponse.json({ blocked: false });
  }

  const ip = getClientIp(req);
  const cutoff = new Date(Date.now() - BLOCK_MINUTES * 60 * 1000);

  const recent = await prisma.reviewLog.findFirst({
    where: { ip, createdAt: { gte: cutoff } },
    orderBy: { createdAt: "desc" },
  });

  if (recent) {
    return NextResponse.json({ blocked: true });
  }
  return NextResponse.json({ blocked: false });
}

// POST: 評価を記録
export async function POST(req: NextRequest) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "main" } });
  const ipBlockEnabled = settings?.reviewIpBlock ?? true;

  const ip = getClientIp(req);

  if (ipBlockEnabled) {
    const cutoff = new Date(Date.now() - BLOCK_MINUTES * 60 * 1000);
    const recent = await prisma.reviewLog.findFirst({
      where: { ip, createdAt: { gte: cutoff } },
    });
    if (recent) {
      return NextResponse.json({ error: "already_submitted" }, { status: 429 });
    }
  }

  const body = await req.json();
  const rating = Number(body.rating);
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "invalid_rating" }, { status: 400 });
  }

  await prisma.reviewLog.create({ data: { ip, rating } });

  return NextResponse.json({ ok: true, rating });
}
