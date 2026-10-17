// @/src/components/site-font/font-zen-maru.tsx
"use client";
// ※ next/font の呼び出しはファイルごとに1つ（SiteFont が選ばれたファイルだけを描画する）。
//   オプションは文字列リテラルで書く必要がある（next/font の仕様）。
import { Zen_Maru_Gothic } from "next/font/google";
import FontStyle from "./FontStyle";

const font = Zen_Maru_Gothic({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["Hiragino Maru Gothic ProN", "Hiragino Sans", "Yu Gothic", "Meiryo", "sans-serif"],
});

export default function FontZenMaru() {
  return <FontStyle family={font.style.fontFamily} />;
}
