// @/src/lib/fonts.ts
// サイト全体のフォント候補（admin で選択→DB(SiteSettings.fontKey)に保存→layoutで適用）。
//
// 【2026-10-17 表示速度対策】
// 以前は next/font/google で6フォント×最大4ウェイトをモジュール先頭で全部読み込んでいたため、
//  - 全フォントの @font-face がCSSに入り（CSSが重い）
//  - next/font の preload 指定で、使っていないフォントまで全ページで先読み（woff2 約249個・約17MB）
// になっていた。
// → next/font をやめ、layout で「選ばれている1フォントだけ」を Google Fonts のCSSで読み込む方式に変更。
//   - 未選択のフォントは @font-face も出力しない／先読みもしない
//   - ウェイトは 400 / 700 の2つだけ（900 などの太字はブラウザが 700 から自動で太らせる）
//   - Google Fonts の日本語フォントは文字の範囲ごとに分割されているので、そのページで使う文字の分だけ読み込まれる
//   - display=swap なので、フォントの読み込み中もシステムフォントで文字はすぐ表示される
export type FontOption = {
  key: string;
  label: string;
  /** CSS の font-family（読み込み前・失敗時はシステムフォントで表示） */
  family: string;
  /** Google Fonts css2 の family パラメータ */
  googleFamily: string;
};

const JA_FALLBACK = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif';

export const FONT_OPTIONS: FontOption[] = [
  { key: "zen-maru", label: "Zen丸ゴシック（やわらか・現行）", family: `"Zen Maru Gothic", "Hiragino Maru Gothic ProN", ${JA_FALLBACK}`, googleFamily: "Zen+Maru+Gothic:wght@400;700" },
  { key: "zen-kaku", label: "Zen角ゴシック（モダン・きりっと）", family: `"Zen Kaku Gothic New", ${JA_FALLBACK}`, googleFamily: "Zen+Kaku+Gothic+New:wght@400;700" },
  { key: "noto-sans", label: "Noto Sans JP（標準・読みやすい）", family: `"Noto Sans JP", ${JA_FALLBACK}`, googleFamily: "Noto+Sans+JP:wght@400;700" },
  { key: "mplus-rounded", label: "M PLUS Rounded（まるみ）", family: `"M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", ${JA_FALLBACK}`, googleFamily: "M+PLUS+Rounded+1c:wght@400;700" },
  { key: "kosugi-maru", label: "小杉丸ゴシック（カジュアル）", family: `"Kosugi Maru", "Hiragino Maru Gothic ProN", ${JA_FALLBACK}`, googleFamily: "Kosugi+Maru" },
  { key: "shippori-mincho", label: "しっぽり明朝（上品・明朝体）", family: `"Shippori Mincho", "Hiragino Mincho ProN", "Yu Mincho", serif`, googleFamily: "Shippori+Mincho:wght@400;700" },
];

export const DEFAULT_FONT_KEY = "zen-maru";

export function getFontOption(key?: string | null): FontOption {
  return FONT_OPTIONS.find((f) => f.key === key) || FONT_OPTIONS[0];
}

/** 選ばれているフォント1つ分の Google Fonts CSS の URL */
export function getFontCssHref(key?: string | null): string {
  return `https://fonts.googleapis.com/css2?family=${getFontOption(key).googleFamily}&display=swap`;
}

/**
 * 互換用（旧：next/font の className を返していた）。
 * 今はフォントを layout の body の style で指定するので、空文字を返す。
 */
export function getFontClassName(_key?: string | null): string {
  return "";
}
