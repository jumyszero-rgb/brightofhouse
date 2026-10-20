// @/src/app/api/admin/lead-events/route.ts
// 管理画面 /admin/lead-events 用（管理者ログイン必須）。
//  GET ?from=YYYY-MM-DD&to=YYYY-MM-DD&type=phone|line|form|booking → 記録の一覧＋キャンペーン名の対応＋ページ表示の集計（人気のページ）
//  PUT { campaignNames: { "<キャンペーンID>": "<表示名>" } } → 対応表を保存（SiteSettings.campaignNames）
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { toCampaignNames } from "@/lib/leadSource";

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

/** "YYYY-MM-DD"（日本時間の日付）→ その日の0時（日本時間）の Date */
function jstDayStart(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const d = new Date(`${ymd}T00:00:00+09:00`);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = request.nextUrl.searchParams;
  const from = jstDayStart(sp.get("from") || "");
  const toStart = jstDayStart(sp.get("to") || "");
  const to = toStart ? new Date(toStart.getTime() + 24 * 60 * 60 * 1000) : null; // to の日の終わりまで
  const type = sp.get("type");

  const where: Record<string, unknown> = {};
  if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) };
  if (type && ["phone", "line", "form", "booking"].includes(type)) where.type = type;

  try {
    // ページ表示の集計（日本時間の日付文字列で絞り込み）
    const fromYmd = sp.get("from") || "";
    const toYmd = sp.get("to") || "";
    const dayWhere: Record<string, string> = {};
    if (/^\d{4}-\d{2}-\d{2}$/.test(fromYmd)) dayWhere.gte = fromYmd;
    if (/^\d{4}-\d{2}-\d{2}$/.test(toYmd)) dayWhere.lte = toYmd;

    const [events, settings, pageRows] = await Promise.all([
      prisma.leadEvent.findMany({ where, orderBy: { createdAt: "desc" }, take: 2000 }),
      prisma.siteSettings.findUnique({ where: { id: "main" }, select: { campaignNames: true } }),
      prisma.pageViewDaily
        .groupBy({
          by: ["path"],
          where: Object.keys(dayWhere).length ? { day: dayWhere } : {},
          _sum: { views: true, adViews: true },
          orderBy: { _sum: { views: "desc" } },
          take: 200,
        })
        .catch(() => []), // テーブル追加前でも画面は出す
    ]);
    const pages = (pageRows as { path: string; _sum: { views: number | null; adViews: number | null } }[]).map((r) => ({
      path: r.path,
      views: r._sum.views || 0,
      adViews: r._sum.adViews || 0,
    }));
    return NextResponse.json({ events, campaignNames: toCampaignNames(settings?.campaignNames), pages });
  } catch (e: any) {
    return NextResponse.json({ error: "Fetch error: " + e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const names = toCampaignNames(body?.campaignNames);
    // IDは数字のみ・名前は100文字まで
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(names)) if (/^\d+$/.test(k) && v.trim()) clean[k] = v.trim().slice(0, 100);
    await prisma.siteSettings.upsert({
      where: { id: "main" },
      update: { campaignNames: clean },
      create: { id: "main", campaignNames: clean },
    });
    return NextResponse.json({ campaignNames: clean });
  } catch (e: any) {
    return NextResponse.json({ error: "Save error: " + e.message }, { status: 500 });
  }
}
