// @/src/app/api/lp/import-static/route.ts
// 静的広告LP（lpContent.ts）を DB(LandingPage) の下書きとして取り込むAPI。
// GET  : 取り込み可能な静的LP一覧＋取り込み済みか（id/status）を返す
// POST : {key} を下書き(DRAFT)として作成（既にあれば作らず既存idを返す）
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getImportableLps, lpContentToCreateData } from "@/lib/lpStaticImport";

export const dynamic = "force-dynamic";

export async function GET() {
  const importable = getImportableLps();
  const slugs = importable.map((i) => i.slug);
  const existing = await prisma.landingPage.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, status: true },
  });
  const bySlug: Record<string, { id: string; status: string }> = Object.fromEntries(
    existing.map((e) => [e.slug, { id: e.id, status: e.status }])
  );
  return NextResponse.json(
    importable.map((i) => ({
      key: i.key,
      slug: i.slug,
      title: i.title,
      url: i.url,
      imported: !!bySlug[i.slug],
      id: bySlug[i.slug]?.id || null,
      status: bySlug[i.slug]?.status || null,
    }))
  );
}

export async function POST(req: Request) {
  const { key } = await req.json().catch(() => ({ key: "" }));
  const target = getImportableLps().find((i) => i.key === key);
  if (!target) return NextResponse.json({ error: "unknown key" }, { status: 400 });

  const exists = await prisma.landingPage.findUnique({
    where: { slug: target.slug },
    select: { id: true },
  });
  if (exists) return NextResponse.json({ id: exists.id, alreadyExists: true });

  const data = lpContentToCreateData(target.content, { slug: target.slug, title: target.title });
  const created = await prisma.landingPage.create({ data: data as any, select: { id: true } });
  return NextResponse.json({ id: created.id, created: true });
}
