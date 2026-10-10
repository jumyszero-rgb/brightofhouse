// @/src/lib/leadTracking.ts
// 広告流入の計測補助（クライアント専用）。
//  1) ランディング時に gclid / utm_* / 着地URL を sessionStorage に保存（初回タッチ優先）
//  2) フォーム送信“成功時”に GA4 の generate_lead を gtag で発火
//     （ブラウザで gtag を叩くので広告クリック=gclid と自動で結びつき、Google広告に正しく返る）
//  3) 保存した流入元をフォーム送信に添えて、通知メールに載せられるようにする

export type TrafficSource = {
  gclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landingUrl?: string;
};

const KEY = "bh_traffic_source";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

/** ランディング時に呼ぶ。gclid / utm_* があれば保存（初回を優先して上書きしない）。 */
export function captureTrafficSource(): void {
  if (typeof window === "undefined") return;
  try {
    const sp = new URLSearchParams(window.location.search);
    const picked: TrafficSource = {};
    const gclid = sp.get("gclid");
    if (gclid) picked.gclid = gclid;
    for (const k of UTM_KEYS) {
      const v = sp.get(k);
      if (v) picked[k] = v;
    }
    const hasNew = Object.keys(picked).length > 0;
    const existingRaw = sessionStorage.getItem(KEY);
    const existing: TrafficSource = existingRaw ? JSON.parse(existingRaw) : {};
    // 既存の流入元があり、今回URLに新しいパラメータが無ければ、初回タッチを尊重して何もしない。
    if (!hasNew && existingRaw) return;
    const data: TrafficSource = {
      ...existing,
      ...picked,
      landingUrl: existing.landingUrl || window.location.pathname + window.location.search,
    };
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* sessionStorage が使えない環境では計測補助をスキップ */
  }
}

/** 保存済みの流入元を取得（無ければ空オブジェクト）。 */
export function getTrafficSource(): TrafficSource {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TrafficSource) : {};
  } catch {
    return {};
  }
}

/** フォームに添える隠しフィールド用の文字列マップ（gclid/utm/landingUrl）。 */
export function trafficSourceFields(): Record<string, string> {
  const t = getTrafficSource();
  const out: Record<string, string> = {};
  if (t.gclid) out.gclid = t.gclid;
  for (const k of UTM_KEYS) if (t[k]) out[k] = t[k] as string;
  if (t.landingUrl) out.landingUrl = t.landingUrl;
  return out;
}

/**
 * GA4 の generate_lead を1回だけ発火する。
 * gtag がまだ用意できていない場合は 0.1秒ごとに最大5秒待ってから発火する。
 * ※送信APIが成功した“後だけ”呼ぶこと（バリデーションエラー時は呼ばない）。
 */
export function fireGenerateLead(params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const payload = { currency: "JPY", ...params };
  const fire = (): boolean => {
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    if (typeof w.gtag !== "function") return false;
    w.gtag("event", "generate_lead", payload);
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[leadTracking] generate_lead 発火", payload);
    }
    return true;
  };
  if (fire()) return;
  let tries = 0;
  const id = setInterval(() => {
    tries += 1;
    if (fire() || tries >= 50) clearInterval(id);
  }, 100);
}
