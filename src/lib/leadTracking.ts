// @/src/lib/leadTracking.ts
// 広告流入・問い合わせの計測補助（クライアント専用）。
//  1) ランディング時に gclid / utm_* / 着地URL / 外部の参照元(referrer) を sessionStorage に保存（初回タッチ優先）
//  2) フォーム・予約の「送信成功レスポンスを受けた時点」で GA4 の generate_lead を1回だけ送る
//     （サンキューページの表示やGA4の「イベントを作成」ルールには頼らない）
//  3) 保存した流入元をフォーム送信に添えて、通知メールに載せられるようにする

export type TrafficSource = {
  gclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landingUrl?: string;
  /** 初回ランディング時の外部参照元（google.com など）。自サイト内の移動は入れない */
  referrer?: string;
};

const KEY = "bh_traffic_source";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

function externalReferrer(): string {
  try {
    if (!document.referrer) return "";
    const u = new URL(document.referrer);
    if (u.host === window.location.host) return "";
    return `${u.origin}${u.pathname}`.slice(0, 200);
  } catch {
    return "";
  }
}

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
    const ref = externalReferrer();
    if (ref) picked.referrer = ref;
    const hasNew = Object.keys(picked).length > 0;
    const existingRaw = sessionStorage.getItem(KEY);
    const existing: TrafficSource = existingRaw ? JSON.parse(existingRaw) : {};
    // 既存の流入元があり、今回URLに新しいパラメータが無ければ、初回タッチを尊重して何もしない。
    if (!hasNew && existingRaw) return;
    const data: TrafficSource = {
      ...existing,
      ...picked,
      referrer: existing.referrer || picked.referrer,
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

/** フォームに添える隠しフィールド用の文字列マップ（gclid/utm/landingUrl/referrer）。 */
export function trafficSourceFields(): Record<string, string> {
  const t = getTrafficSource();
  const out: Record<string, string> = {};
  if (t.gclid) out.gclid = t.gclid;
  for (const k of UTM_KEYS) if (t[k]) out[k] = t[k] as string;
  if (t.landingUrl) out.landingUrl = t.landingUrl;
  // 保存が無い（sessionStorage不可など）場合も、今の参照元だけは添える
  const ref = t.referrer || externalReferrer();
  if (ref) out.referrer = ref;
  return out;
}

type Gtag = (...args: unknown[]) => void;

/**
 * 送信成功時に generate_lead を1回だけ送り、送信が終わる（または最大1.2秒）まで待ってから resolve する。
 * 直後にページ遷移しても取りこぼさないよう transport_type: 'beacon' ＋ event_callback を使う。
 *   lead_type: 'form'（LP・HPのフォーム）/ 'booking'（カレンダー予約）
 */
export function sendGenerateLead(params: { lead_type: "form" | "booking"; [k: string]: unknown }): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    const w = window as unknown as { gtag?: Gtag };
    const payload = {
      page_path: window.location.pathname,
      ...params,
      transport_type: "beacon",
      event_callback: finish,
      event_timeout: 1000,
    };
    try {
      if (typeof w.gtag === "function") w.gtag("event", "generate_lead", payload);
      else finish();
    } catch {
      finish();
    }
    setTimeout(finish, 1200);
  });
}

/** 互換用（旧 ConversionTracker から使っていた）。新しいコードは sendGenerateLead を使う。 */
export function fireGenerateLead(params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: Gtag };
  if (typeof w.gtag === "function") w.gtag("event", "generate_lead", { currency: "JPY", ...params });
}
