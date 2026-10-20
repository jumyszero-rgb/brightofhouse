// @/src/lib/attribution.ts
// 問い合わせ行動の自前記録（クライアント専用・修正依頼書 0-E）。
// 電話タップ・LINEタップ・フォーム送信・予約の瞬間に、サイトのDB（LeadEvent）へ1件保存する。
// 流入情報は leadTracking.ts がランディング時に sessionStorage へ保存したもの（メール通知と同じデータ）を使う。
//  - tel: や LINE はページを離れるので、navigator.sendBeacon で送る（使えなければ fetch keepalive）
//  - GA4 の phone_tap / line_click / generate_lead とは別に送る（GA4の反映待ちなしで見るため）
import { getTrafficSource } from "@/lib/leadTracking";

export type LeadType = "phone" | "line" | "form" | "booking";

export function trackLead(type: LeadType, extra: { phoneNumber?: string; bookingId?: string } = {}): void {
  if (typeof window === "undefined") return;
  try {
    const t = getTrafficSource();
    const payload = {
      type,
      phoneNumber: extra.phoneNumber || undefined,
      bookingId: extra.bookingId || undefined,
      pagePath: window.location.pathname + window.location.search,
      landingPath: t.landingUrl || window.location.pathname + window.location.search,
      referrer: t.referrer || "",
      gclid: t.gclid,
      gbraid: t.gbraid,
      wbraid: t.wbraid,
      kw: t.kw,
      mt: t.mt,
      cid: t.cid,
      ag: t.ag,
      asg: t.asg,
      utm_source: t.utm_source,
      utm_medium: t.utm_medium,
      utm_campaign: t.utm_campaign,
      utm_term: t.utm_term,
      device: window.innerWidth < 768 ? "mobile" : "desktop",
    };
    const body = JSON.stringify(payload);
    const url = "/api/lead-event";
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const ok = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      if (ok) return;
    }
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    /* 記録に失敗しても画面の動作は止めない */
  }
}

/**
 * ページ表示の記録（人気のページの集計用）。ページ×日ごとの件数だけを保存し、個人を特定する情報は送らない。
 * 管理画面・API・プレビューは数えない。
 */
export function trackPageView(pathname: string): void {
  if (typeof window === "undefined") return;
  try {
    if (/^\/(admin|api)(\/|$)/.test(pathname)) return;
    if (new URLSearchParams(window.location.search).has("preview")) return;
    const t = getTrafficSource();
    const body = JSON.stringify({ path: pathname, isAd: !!(t.gclid || t.gbraid || t.wbraid) });
    const url = "/api/pageview";
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      if (navigator.sendBeacon(url, new Blob([body], { type: "application/json" }))) return;
    }
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    /* 記録に失敗しても画面の動作は止めない */
  }
}
