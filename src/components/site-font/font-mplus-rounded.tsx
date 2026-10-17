// @/src/components/site-font/font-mplus-rounded.tsx
"use client";
// ※ next/font の呼び出しはファイルごとに1つ（SiteFont が選ばれたファイルだけを描画する）。
//   オプションは文字列リテラルで書く必要がある（next/font の仕様）。
import { M_PLUS_Rounded_1c } from "next/font/google";
import FontStyle from "./FontStyle";

const font = M_PLUS_Rounded_1c({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["Hiragino Maru Gothic ProN", "Hiragino Sans", "Yu Gothic", "Meiryo", "sans-serif"],
});

export default function FontMplusRounded() {
  return <FontStyle family={font.style.fontFamily} />;
}
