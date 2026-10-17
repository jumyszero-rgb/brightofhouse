// @/src/components/site-font/font-shippori-mincho.tsx
"use client";
// ※ next/font の呼び出しはファイルごとに1つ（SiteFont が選ばれたファイルだけを描画する）。
//   オプションは文字列リテラルで書く必要がある（next/font の仕様）。
import { Shippori_Mincho } from "next/font/google";
import FontStyle from "./FontStyle";

const font = Shippori_Mincho({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["Hiragino Mincho ProN", "Yu Mincho", "serif"],
});

export default function FontShipporiMincho() {
  return <FontStyle family={font.style.fontFamily} />;
}
