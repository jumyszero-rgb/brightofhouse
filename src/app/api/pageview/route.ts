// @/src/app/api/pageview/route.ts
// ページ表示の記録（公開・認証なし）。ページ×日（日本時間）ごとの件数を1増やすだけ。
// - 個人を特定する情報（IP・端末ID等）は保存しない
// - ボットは数えない／同じIPから1分間に120件を超えたら無視（IPはメモリ上で数えるだけ）
// - 400日より古い集計はときどき自動で削除
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const BOT_RE = /bot|crawler|spider|Lighthouse|HeadlessChrome|PageSpeed|Google-InspectionTool|facebookexternalhit|Prerender/i;
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 120;

const g = globalThis as unknown as { __bhPvHits?: Map<string, number[]>; __bhPvCleanupAt?: number };
const hits: Map<string, number[]> = g.__bhPvHits ?? (g.__bhPvHits = new Map());

function limited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return list.length > MAX_PER_WINDOW;
}

function jstDay(d = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(d);
}

export async function POST(request: NextRequest) {
  try {
    const ua = request.headers.get("user-agent") || "";
    if (!ua || BOT_RE.test(ua)) return new NextResponse(null, { status: 204 });
    // ブラウザの先読み（prefetch）は数えない
    if ((request.headers.get("purpose") || request.headers.get("sec-purpose") || "").includes("prefetch")) {
      return new NextResponse(null, { status: 204 });
    }
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (limited(ip)) return new NextResponse(null, { status: 204 });

    let b: Record<string, unknown>;
    try {
      b = JSON.parse(await request.text());
    } catch {
      return NextResponse.json({ error: "bad json" }, { status: 400 });
    }
    let path = typeof b.path === "string" ? b.path.split("?")[0].split("#")[0] : "";
    if (!path.startsWith("/") || /^\/(admin|api)(\/|$)/.test(path)) return new NextResponse(null, { status: 204 });
    try {
      path = decodeURI(path);
    } catch {
      /* そのまま */
    }
    path = path.slice(0, 300);
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    const isAd = b.isAd === true;
    const day = jstDay();

    const update = { views: { increment: 1 }, ...(isAd ? { adViews: { increment: 1 } } : {}) };
    try {
      await prisma.pageViewDaily.upsert({
        where: { day_path: { day, path } },
        create: { day, path, views: 1, adViews: isAd ? 1 : 0 },
        update,
      });
    } catch (e: any) {
      // 同じ日・同じページの最初の1件が同時に来た場合（重複エラー）は、足し算だけやり直す
      if (e?.code !== "P2002") throw e;
      await prisma.pageViewDaily.update({ where: { day_path: { day, path } }, data: update });
    }

    // 400日より古い集計の削除（1日1回まで）
    const now = Date.now();
    if (!g.__bhPvCleanupAt || now - g.__bhPvCleanupAt > 24 * 60 * 60 * 1000) {
      g.__bhPvCleanupAt = now;
      const cutoff = jstDay(new Date(now - 400 * 24 * 60 * 60 * 1000));
      prisma.pageViewDaily.deleteMany({ where: { day: { lt: cutoff } } }).catch((e) => console.error("[pageview] cleanup failed", e));
    }
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("[pageview] save failed", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
