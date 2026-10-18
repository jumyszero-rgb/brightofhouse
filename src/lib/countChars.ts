// @/src/lib/countChars.ts
// 文字数カウント（空白・改行を除く）。ブログ編集の3方式（Tiptap / BlockNote / HTML）で共通。
// 公開ページでブラウザのConsoleを使って数えた方法と同じ基準になるよう、HTMLタグを除いた本文テキストを数える。
// サーバー描画でも動くよう、DOMParserは使わず正規表現で処理する（追加パッケージ不要）。
export function countChars(html: string): number {
  if (!html) return 0;
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-zA-Z0-9#]+;/g, "x");
  return Array.from(text.replace(/\s/g, "")).length;
}

export function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
