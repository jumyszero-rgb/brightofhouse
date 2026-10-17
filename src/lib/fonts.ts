// @/src/lib/fonts.ts
// サイト全体のフォント候補（admin で選択→DB(SiteSettings.fontKey)に保存→layoutで適用）。
//
// 【2026-10 表示速度対策・最終形】
//  1回目：next/font で6フォント×最大4ウェイトを全部読み込み → 全フォントの @font-face と先読み(1,319本)で重い
//  2回目：選択中の1フォントだけ Google Fonts の外部CSSで読み込み → 外部CSSが描画をブロック（FCP 8.6秒）
//  今回 ：next/font/google を「フォントごとに別ファイル」にし、選ばれているフォントのファイルだけを
//         表示時に読み込む（src/components/site-font/）。
//         - フォントファイルはビルド時にダウンロードされ、自社ドメイン（/_next/static/media/）から配信
//         - そのページに出力されるCSSは「選択中の1フォント×2ウェイト(400/700)」だけ
//         - 外部（fonts.googleapis.com / fonts.gstatic.com）への接続はゼロ
//         - display: swap なので、フォントの読み込み中もシステムフォントで文字はすぐ表示される
//         - preload は使わない（日本語フォントは文字範囲ごとに100以上のファイルに分割されているため、
//           先読みは逆効果。必要な文字のファイルだけが自動で読み込まれる）
export type FontOption = {
  key: string;
  label: string;
};

export const FONT_OPTIONS: FontOption[] = [
  { key: "zen-maru", label: "Zen丸ゴシック（やわらか・現行）" },
  { key: "zen-kaku", label: "Zen角ゴシック（モダン・きりっと）" },
  { key: "noto-sans", label: "Noto Sans JP（標準・読みやすい）" },
  { key: "mplus-rounded", label: "M PLUS Rounded（まるみ）" },
  { key: "kosugi-maru", label: "小杉丸ゴシック（カジュアル）" },
  { key: "shippori-mincho", label: "しっぽり明朝（上品・明朝体）" },
];

export const DEFAULT_FONT_KEY = "zen-maru";

/** 未知のキー・未設定は既定フォントに寄せる */
export function normalizeFontKey(key?: string | null): string {
  return FONT_OPTIONS.some((f) => f.key === key) ? (key as string) : DEFAULT_FONT_KEY;
}

export function getFontOption(key?: string | null): FontOption {
  return FONT_OPTIONS.find((f) => f.key === key) || FONT_OPTIONS[0];
}

/** 互換用（旧：next/font の className を返していた）。今は SiteFont が body のフォントを指定する。 */
export function getFontClassName(_key?: string | null): string {
  return "";
}
