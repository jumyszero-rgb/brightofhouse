// @/src/components/site-font/font-noto-sans.tsx
"use client";
// ※ next/font の呼び出しはファイルごとに1つ（SiteFont が選ばれたファイルだけを描画する）。
//   オプションは文字列リテラルで書く必要がある（next/font の仕様）。
import { Noto_Sans_JP } from "next/font/google";
import FontStyle from "./FontStyle";

const font = Noto_Sans_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "sans-serif"],
});

export default function FontNotoSans() {
  return <FontStyle family={font.style.fontFamily} />;
}
