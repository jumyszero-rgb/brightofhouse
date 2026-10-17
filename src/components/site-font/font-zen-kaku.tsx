// @/src/components/site-font/font-zen-kaku.tsx
"use client";
// ※ next/font の呼び出しはファイルごとに1つ（SiteFont が選ばれたファイルだけを描画する）。
//   オプションは文字列リテラルで書く必要がある（next/font の仕様）。
import { Zen_Kaku_Gothic_New } from "next/font/google";
import FontStyle from "./FontStyle";

const font = Zen_Kaku_Gothic_New({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "sans-serif"],
});

export default function FontZenKaku() {
  return <FontStyle family={font.style.fontFamily} />;
}
