// @/src/lib/leadTracking.ts
// 広告流入・問い合わせの計測補助（クライアント専用）。
//  1) ランディング時に gclid / utm_* / 着地URL / 外部の参照元(referrer) を sessionStorage に保存（初回タッチ優先）
//  2) フォーム・予約の「送信成功レスポンスを受けた時点」で GA4 の generate_lead を1回だけ送る
//     （サンキューページの表示やGA4の「イベントを作成」ルールには頼らない）
//  3) 保存した流入元をフォーム送信に添えて、通知メールに載せられるようにする

export type TrafficSource = {
  gclid?: string;
  /** iOS等で gclid の代わりに付く広告クリックID */
  gbraid?: string;
  wbraid?: string;
  /** Google広告の「最終ページURLのサフィックス」 kw={keyword}&mt={matchtype}&cid={campaignid} */
  kw?: string;
  mt?: string;
  cid?: string;
  /** 広告グループID（検索 ag={adgroupid}）／アセットグループID（P-MAX asg={assetgroupid}） */
  ag?: string;
  asg?: string;
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
/** 広告クリックID・サフィックス（URLにあれば保存） */
const AD_KEYS = ["gbraid", "wbraid", "kw", "mt", "cid", "ag", "asg"] as const;

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

// ===== 過去の広告訪問（ブラウザに残す・個人情報は入れない） =====
// 広告から来たとき（URLに gclid / gbraid / wbraid）に記録し、あとで「直接・検索・Googleマップ」などから
// 戻ってきて問い合わせた人も「前に広告で来た人」と分かるようにする。
//  - boh_first_ad：初めて広告から来た記録（日時・着地ページ・キーワード・マッチタイプ・キャンペーンID）。上書きしない
//  - boh_last_ad ：最後に広告から来た日時。毎回上書き
//  - どちらも90日を過ぎたら消す
//  ※ブラウザに残す方式なので、別のスマホ・PC・ブラウザで戻ってきた場合は追えない
const FIRST_AD_KEY = "boh_first_ad";
const LAST_AD_KEY = "boh_last_ad";
const AD_TTL_MS = 90 * 24 * 60 * 60 * 1000;

type FirstAd = { at: string; landing?: string; kw?: string; mt?: string; cid?: string };
type LastAd = { at: string };

export type AdHistory = {
  firstAdAt?: string;
  firstAdKeyword?: string;
  firstAdMatchType?: string;
  firstAdLanding?: string;
  firstAdCampaignId?: string;
  lastAdAt?: string;
};

function readFresh<T extends { at: string }>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw) as T;
    const t = Date.parse(v?.at || "");
    if (!t || Date.now() - t > AD_TTL_MS) {
      localStorage.removeItem(key); // 90日を過ぎた記録は消す
      return null;
    }
    return v;
  } catch {
    return null;
  }
}

/** 広告から来たときに呼ぶ（captureTrafficSource の中から） */
function saveAdTouch(sp: URLSearchParams): void {
  try {
    const now = new Date().toISOString();
    if (!readFresh<FirstAd>(FIRST_AD_KEY)) {
      const first: FirstAd = {
        at: now,
        landing: (window.location.pathname + window.location.search).slice(0, 300),
        kw: sp.get("kw")?.slice(0, 200) || undefined,
        mt: sp.get("mt")?.slice(0, 20) || undefined,
        cid: sp.get("cid")?.slice(0, 50) || undefined,
      };
      localStorage.setItem(FIRST_AD_KEY, JSON.stringify(first));
    }
    localStorage.setItem(LAST_AD_KEY, JSON.stringify({ at: now } satisfies LastAd));
  } catch {
    /* localStorage が使えない環境（プライベートブラウズ等）では記録しない */
  }
}

/** 過去の広告訪問の記録（90日以内のもの）。問い合わせ行動の記録に添える */
export function getAdHistory(): AdHistory {
  if (typeof window === "undefined") return {};
  const first = readFresh<FirstAd>(FIRST_AD_KEY);
  const last = readFresh<LastAd>(LAST_AD_KEY);
  const out: AdHistory = {};
  if (first) {
    out.firstAdAt = first.at;
    if (first.kw) out.firstAdKeyword = first.kw;
    if (first.mt) out.firstAdMatchType = first.mt;
    if (first.landing) out.firstAdLanding = first.landing;
    if (first.cid) out.firstAdCampaignId = first.cid;
  }
  if (last) out.lastAdAt = last.at;
  return out;
}

/** ランディング時に呼ぶ。gclid / utm_* があれば保存（初回を優先して上書きしない）。 */
export function captureTrafficSource(): void {
  if (typeof window === "undefined") return;
  try {
    const sp = new URLSearchParams(window.location.search);
    // 広告から来た（クリックIDがある）なら、過去の広告訪問として localStorage にも残す
    if (sp.get("gclid") || sp.get("gbraid") || sp.get("wbraid")) saveAdTouch(sp);
    const picked: TrafficSource = {};
    const gclid = sp.get("gclid");
    if (gclid) picked.gclid = gclid;
    for (const k of UTM_KEYS) {
      const v = sp.get(k);
      if (v) picked[k] = v;
    }
    for (const k of AD_KEYS) {
      const v = sp.get(k);
      if (v) picked[k] = v.slice(0, 200);
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
  for (const k of AD_KEYS) if (t[k]) out[k] = t[k] as string;
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
    const w = window as unknown as { gtag?: Gtag; google_tag_manager?: unknown; __bhLoadGtag?: () => void };
    // Googleタグは遅延読み込みなので、まだなら今すぐ読み込む（読み込み前のイベントは読み込み後に送られる）
    const tagReady = !!w.google_tag_manager;
    if (!tagReady) w.__bhLoadGtag?.();
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
    // タグ読み込み済みなら最大1.2秒、読み込み中なら最大3.5秒待ってから次へ進む
    setTimeout(finish, tagReady ? 1200 : 3500);
  });
}

/** 互換用（旧 ConversionTracker から使っていた）。新しいコードは sendGenerateLead を使う。 */
export function fireGenerateLead(params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: Gtag };
  if (typeof w.gtag === "function") w.gtag("event", "generate_lead", { currency: "JPY", ...params });
}
