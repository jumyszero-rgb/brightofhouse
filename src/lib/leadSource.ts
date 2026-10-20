// @/src/lib/leadSource.ts
// 流入元の表示用ヘルパー（サーバー・クライアント共通／依存なし）。
// 管理画面 /admin/lead-events と、フォーム・予約の通知メールの【流入元】で同じ判定を使う。

/** マッチタイプ（Google広告 {matchtype}）の表示名 */
export function matchTypeLabel(mt?: string | null): string {
  if (!mt) return "";
  if (mt === "e") return "完全一致";
  if (mt === "p") return "フレーズ一致";
  if (mt === "b") return "インテントマッチ";
  return mt;
}

/** 広告クリックか（gclid / gbraid / wbraid のいずれか） */
export function isAdClick(s: { gclid?: string | null; gbraid?: string | null; wbraid?: string | null }): boolean {
  return !!(s.gclid || s.gbraid || s.wbraid);
}

/** 流入の種類：広告／Google検索／Googleマップ／Yahoo／SNS／直接／その他（utm があれば utm_source / utm_medium） */
export function classifySource(s: {
  isAd?: boolean;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
}): string {
  if (s.isAd) return "広告";
  if (s.utmSource || s.utmMedium) return [s.utmSource, s.utmMedium].filter(Boolean).join(" / ");
  const r = (s.referrer || "").toLowerCase();
  if (!r) return "直接";
  if (/google\.[^/]+\/maps|maps\.google\.|maps\.app\.goo\.gl|g\.page/.test(r)) return "Googleマップ";
  if (/(^|\/\/|\.)google\./.test(r)) return "Google検索";
  if (/yahoo\./.test(r)) return "Yahoo";
  if (/bing\./.test(r)) return "Bing";
  if (/instagram\.|facebook\.|fb\.|t\.co\/|twitter\.|x\.com|line\.me|tiktok\.|youtube\./.test(r)) return "SNS";
  return "その他";
}

/** キャンペーンID → 表示名（未登録ならIDのまま） */
export function campaignLabel(cid: string | null | undefined, names: Record<string, string> | null | undefined): string {
  if (!cid) return "";
  return (names && names[cid]) || cid;
}

/** SiteSettings.campaignNames（Json）を安全に Record<string,string> に */
export function toCampaignNames(v: unknown): Record<string, string> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === "string" && k.trim()) out[k.trim()] = val;
  }
  return out;
}
