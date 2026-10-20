// @/src/lib/blogFigure.ts
// ブログ本文（HTMLモード）用の画像HTML。
// HTMLモードの「🖼 画像を挿入」と、画像アップロード・管理画面の「タグ付きコピー」で同じ形を使う。

/** HTMLの属性値・本文に入れる文字をエスケープ */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 画像の <figure> HTML（キャプションが空なら figcaption は入れない） */
export function buildFigure(url: string, caption: string): string {
  const cap = escapeHtml((caption || "").trim());
  const img = `<img src="${escapeHtml(url)}" alt="${cap}" style="width:100%;height:auto;border-radius:8px;">`;
  const figcaption = cap
    ? `<figcaption style="text-align:center;font-size:0.85em;color:#6b7280;margin-top:6px;">${cap}</figcaption>`
    : "";
  return `<figure style="margin:16px 0;">${img}${figcaption}</figure>`;
}
