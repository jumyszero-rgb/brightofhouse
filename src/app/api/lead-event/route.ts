// @/src/app/api/lead-event/route.ts
// 問い合わせ行動（電話タップ・LINEタップ・フォーム送信・予約）の記録（公開・認証なし・修正依頼書 0-E）。
// - 個人情報（氏名・お客様の電話番号・IP）は保存しない
// - ボットは保存しない／同じIPから1分間に20件を超えたら無視（IPはメモリ上で数えるだけ）
// - 13か月より古い記録はときどき自動で削除
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdClick } from "@/lib/leadSource";

export const runtime = "nodejs";

const TYPES = new Set(["phone", "line", "form", "booking"]);
const BOT_RE = /bot|crawler|spider|Lighthouse|HeadlessChrome|PageSpeed|Google-InspectionTool|facebookexternalhit/i;
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 20;
const RETENTION_MS = 400 * 24 * 60 * 60 * 1000; // 約13か月

const g = globalThis as unknown as { __bhLeadHits?: Map<string, number[]>; __bhLeadCleanupAt?: number };
const hits: Map<string, number[]> = g.__bhLeadHits ?? (g.__bhLeadHits = new Map());

function limited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return list.length > MAX_PER_WINDOW;
}

/** 文字列だけを最大500文字で取り出す（空なら null） */
const s500 = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, 500) : null);

export async function POST(request: NextRequest) {
  try {
    const ua = request.headers.get("user-agent") || "";
    if (BOT_RE.test(ua)) return new NextResponse(null, { status: 204 });

    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (limited(ip)) return new NextResponse(null, { status: 204 });

    // sendBeacon は Content-Type が text/plain の場合もあるので、本文を文字列で読んでから JSON にする
    const raw = await request.text();
    let b: Record<string, unknown>;
    try {
      b = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "bad json" }, { status: 400 });
    }
    const type = typeof b.type === "string" ? b.type : "";
    if (!TYPES.has(type)) return NextResponse.json({ error: "bad type" }, { status: 400 });

    // 過去の広告訪問の日時（ブラウザから届いた値）。おかしな値（未来・400日より前・日付でない）は捨てる
    const adDate = (v: unknown): Date | null => {
      if (typeof v !== "string" || v.length > 40) return null;
      const t = Date.parse(v);
      if (!t) return null;
      const now = Date.now();
      if (t > now + 24 * 60 * 60 * 1000 || t < now - 400 * 24 * 60 * 60 * 1000) return null;
      return new Date(t);
    };
    const firstAdAt = adDate(b.firstAdAt);

    const gclid = s500(b.gclid);
    const gbraid = s500(b.gbraid);
    const wbraid = s500(b.wbraid);

    await prisma.leadEvent.create({
      data: {
        type,
        phoneNumber: type === "phone" ? s500(b.phoneNumber) : null,
        pagePath: s500(b.pagePath) || "/",
        landingPath: s500(b.landingPath),
        referrer: s500(b.referrer),
        isAd: isAdClick({ gclid, gbraid, wbraid }),
        gclid: gclid || gbraid || wbraid, // どのクリックIDでも1列に残す
        campaignId: s500(b.cid),
        adGroupId: s500(b.ag),
        assetGroupId: s500(b.asg),
        keyword: s500(b.kw),
        matchType: s500(b.mt),
        utmSource: s500(b.utm_source),
        utmMedium: s500(b.utm_medium),
        utmCampaign: s500(b.utm_campaign),
        utmTerm: s500(b.utm_term),
        device: b.device === "mobile" || b.device === "desktop" ? (b.device as string) : null,
        bookingId: type === "booking" ? s500(b.bookingId) : null,
        firstAdAt,
        firstAdKeyword: firstAdAt ? s500(b.firstAdKeyword) : null,
        firstAdMatchType: firstAdAt ? s500(b.firstAdMatchType) : null,
        firstAdLanding: firstAdAt ? s500(b.firstAdLanding) : null,
        firstAdCampaignId: firstAdAt ? s500(b.firstAdCampaignId) : null,
        lastAdAt: adDate(b.lastAdAt),
      },
    });

    // 13か月より古い記録の削除（1日1回まで）
    const now = Date.now();
    if (!g.__bhLeadCleanupAt || now - g.__bhLeadCleanupAt > 24 * 60 * 60 * 1000) {
      g.__bhLeadCleanupAt = now;
      prisma.leadEvent
        .deleteMany({ where: { createdAt: { lt: new Date(now - RETENTION_MS) } } })
        .catch((e) => console.error("[lead-event] cleanup failed", e));
    }

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("[lead-event] save failed", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
