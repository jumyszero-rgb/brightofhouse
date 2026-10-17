// @/src/components/site-font/SiteFont.tsx
"use client";

/**
 * サイトフォントの切り替え（layout.tsx の <head> に1つ置く）。
 *
 * next/font は「モジュールを import した時点で、そのフォントのCSSがページに入る」仕組みのため、
 * 6フォントを普通に import すると全フォントのCSSが毎ページ出力されてしまう。
 * そこで各フォントを別ファイル（font-*.tsx）にし、next/dynamic で「選ばれているフォントのファイルだけ」を描画する。
 * → サーバー描画時も、実際に描画された1フォント分のCSSだけが <head> に出力される（ビルド検証済み）。
 */
import dynamic from "next/dynamic";
import { normalizeFontKey } from "@/lib/fonts";

const FONTS = {
  "zen-maru": dynamic(() => import("./font-zen-maru")),
  "zen-kaku": dynamic(() => import("./font-zen-kaku")),
  "noto-sans": dynamic(() => import("./font-noto-sans")),
  "mplus-rounded": dynamic(() => import("./font-mplus-rounded")),
  "kosugi-maru": dynamic(() => import("./font-kosugi-maru")),
  "shippori-mincho": dynamic(() => import("./font-shippori-mincho")),
} as const;

export default function SiteFont({ fontKey }: { fontKey?: string | null }) {
  const key = normalizeFontKey(fontKey) as keyof typeof FONTS;
  const Font = FONTS[key];
  return <Font />;
}
