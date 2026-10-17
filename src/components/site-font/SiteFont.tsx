// @/src/components/site-font/SiteFont.tsx
"use client";

/**
 * サイトフォントの切り替え（layout.tsx の <head> に1つ置く）。
 *
 * next/font は「モジュールを import した時点で、そのフォントのCSSがページに入る」仕組みのため、
 * 各フォントを別ファイル（font-*.tsx）にし、next/dynamic で「選ばれているフォントのファイルだけ」を読み込む。
 *
 * 【2026-10-18 表示速度対策】
 * 日本語フォントのCSS（@font-face が文字範囲ごとに約240個・約63KB）を読み終わるまで画面が出なかった。
 * → フォントは「画面が出た後」に読み込む（ssr: false）。
 *   - 最初の一瞬は下の FALLBACK（端末の近い書体）で文字を出し、フォントが届いたら選択中のフォントに切り替わる
 *   - 日本語は全角文字の幅が同じで、行の高さも固定なので、切り替わってもレイアウトはほぼ動かない
 * 「system〜」（端末の標準フォント：ゴシック／丸ゴシック／明朝）を選ぶと、フォントの読み込み自体をしない（最速）。
 */
import dynamic from "next/dynamic";
import { normalizeFontKey } from "@/lib/fonts";

const FONTS = {
  "zen-maru": dynamic(() => import("./font-zen-maru"), { ssr: false }),
  "zen-kaku": dynamic(() => import("./font-zen-kaku"), { ssr: false }),
  "noto-sans": dynamic(() => import("./font-noto-sans"), { ssr: false }),
  "mplus-rounded": dynamic(() => import("./font-mplus-rounded"), { ssr: false }),
  "kosugi-maru": dynamic(() => import("./font-kosugi-maru"), { ssr: false }),
  "shippori-mincho": dynamic(() => import("./font-shippori-mincho"), { ssr: false }),
} as const;

// 端末に入っている書体（iPhone/Mac＝ヒラギノ、Windows＝游ゴシック/メイリオ・游明朝、Android＝Noto）。
// ※ 丸ゴシックは iPhone/Mac だけ（Windows・Android には標準の丸ゴシックが無いため、普通のゴシックで表示される）
const MARU = '"Hiragino Maru Gothic ProN", "Hiragino Sans", "Yu Gothic Medium", "Yu Gothic", YuGothic, Meiryo, sans-serif';
const GOTHIC = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic Medium", "Yu Gothic", YuGothic, Meiryo, sans-serif';
const MINCHO = '"Hiragino Mincho ProN", "Yu Mincho", YuMincho, "Noto Serif JP", serif';

type FontKey = keyof typeof FONTS | "system" | "system-maru" | "system-mincho";

/** フォントが届くまでの表示用（端末に入っている近い書体）。"system" はこれだけで表示する（読み込みなし） */
const FALLBACK: Record<FontKey, string> = {
  system: GOTHIC,
  "system-maru": MARU,
  "system-mincho": MINCHO,
  "zen-maru": MARU,
  "zen-kaku": GOTHIC,
  "noto-sans": GOTHIC,
  "mplus-rounded": MARU,
  "kosugi-maru": MARU,
  "shippori-mincho": MINCHO,
};

export default function SiteFont({ fontKey }: { fontKey?: string | null }) {
  const key = normalizeFontKey(fontKey) as FontKey;
  // 端末の標準フォント（system〜）はフォントを読み込まない
  const Font = key.startsWith("system") ? null : FONTS[key as keyof typeof FONTS];
  return (
    <>
      {/* サーバー描画のHTMLに入る：最初から文字が出る（選択フォントの <style> が後に来て上書きする） */}
      <style>{`html body{font-family:${FALLBACK[key]};}`}</style>
      {Font && <Font />}
    </>
  );
}
