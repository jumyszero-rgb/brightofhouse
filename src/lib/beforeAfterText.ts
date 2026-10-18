// @/src/lib/beforeAfterText.ts
// 作業実績（BeforeAfter）の説明文。
// 以前は「【ビフォー】…【アフター】…」の2つに分けて保存していたが、2026-10 から1つの文章に統一。
// 移行SQLで既存データも1つにまとめるが、万一旧形式が残っていても1つの文章として扱えるようにする。
export function mergeLegacyDescription(desc?: string | null): string {
  if (!desc) return "";
  if (!desc.includes("【ビフォー】") && !desc.includes("【アフター】")) return desc.trim();
  return desc
    .replace(/【ビフォー】[ \t]*\r?\n?/g, "")
    .replace(/\s*【アフター】[ \t]*\r?\n?/g, "\n\n")
    .trim();
}

// ===== 単体ページ（/before-after/[slug]）用 =====

/** 項目ごとの本文（表示順）。未入力の項目は単体ページに出さない */
export const BA_SECTIONS = [
  { key: "reason", label: "依頼のきっかけ" },
  { key: "siteCondition", label: "現場の状態" },
  { key: "workDetail", label: "作業内容" },
  { key: "workTimeStaff", label: "作業時間・人数" },
  { key: "price", label: "料金（税込）" },
  { key: "staffComment", label: "担当者のひとこと" },
] as const;

export type BaSectionKey = (typeof BA_SECTIONS)[number]["key"];
export type BaTextFields = { description?: string | null } & Partial<Record<BaSectionKey, string | null>>;

/** 検索表示の目安（本文の合計文字数・空白改行を除く） */
export const BA_INDEX_MIN_CHARS = 500;

/** 本文（説明文＋各項目）の合計文字数。空白・改行を除く */
export function baTotalChars(item: BaTextFields): number {
  const parts = [mergeLegacyDescription(item.description), ...BA_SECTIONS.map((s) => item[s.key] || "")];
  return Array.from(parts.join("").replace(/\s/g, "")).length;
}

/** meta description の自動生成（説明文→各項目の順で、先頭から約120文字） */
export function baAutoDescription(item: BaTextFields & { title?: string }): string {
  const src = [mergeLegacyDescription(item.description), ...BA_SECTIONS.map((s) => item[s.key] || "")]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const text = src || item.title || "";
  return text.length > 120 ? text.slice(0, 119) + "…" : text;
}

/** slug の正規化：前後の空白を除いて小文字に。空なら null（＝単体ページを作らない） */
export function normalizeBaSlug(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  return s ? s : null;
}

/** slug に使える形式：半角英小文字・数字・ハイフン（先頭末尾のハイフン・連続ハイフンは不可） */
export const BA_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
