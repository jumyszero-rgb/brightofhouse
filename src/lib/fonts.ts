// @/src/lib/fonts.ts
// サイト全体のフォント候補（admin で選択→DB(SiteSettings.fontKey)に保存→layoutで適用）。
// next/font/google は「モジュール先頭での静的呼び出し」が必須のため、候補を事前に読み込んでおき、
// 選択キーに応じて className を出し分ける方式にしている。
import {
  Zen_Maru_Gothic,
  Zen_Kaku_Gothic_New,
  Noto_Sans_JP,
  M_PLUS_Rounded_1c,
  Kosugi_Maru,
  Shippori_Mincho,
} from "next/font/google";

const zenMaru = Zen_Maru_Gothic({ subsets: ["latin"], weight: ["400", "500", "700", "900"], display: "swap" });
const zenKaku = Zen_Kaku_Gothic_New({ subsets: ["latin"], weight: ["400", "500", "700", "900"], display: "swap" });
const notoSans = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap" });
const mplusRounded = M_PLUS_Rounded_1c({ subsets: ["latin"], weight: ["400", "500", "700", "800"], display: "swap" });
const kosugiMaru = Kosugi_Maru({ subsets: ["latin"], weight: ["400"], display: "swap" });
const shippori = Shippori_Mincho({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap" });

export type FontOption = { key: string; label: string; className: string };

export const FONT_OPTIONS: FontOption[] = [
  { key: "zen-maru", label: "Zen丸ゴシック（やわらか・現行）", className: zenMaru.className },
  { key: "zen-kaku", label: "Zen角ゴシック（モダン・きりっと）", className: zenKaku.className },
  { key: "noto-sans", label: "Noto Sans JP（標準・読みやすい）", className: notoSans.className },
  { key: "mplus-rounded", label: "M PLUS Rounded（まるみ）", className: mplusRounded.className },
  { key: "kosugi-maru", label: "小杉丸ゴシック（カジュアル）", className: kosugiMaru.className },
  { key: "shippori-mincho", label: "しっぽり明朝（上品・明朝体）", className: shippori.className },
];

export const DEFAULT_FONT_KEY = "zen-maru";

export function getFontClassName(key?: string | null): string {
  const found = FONT_OPTIONS.find((f) => f.key === key);
  return (found || FONT_OPTIONS[0]).className;
}
