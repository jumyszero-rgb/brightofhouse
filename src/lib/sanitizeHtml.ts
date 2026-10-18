// @/src/lib/sanitizeHtml.ts
// ブログ「HTML」モード用の最低限のサニタイズ（管理者しか書けない前提）。
// 除去するのは <script> と on* 属性（onclick 等）、javascript: のURLだけ。
// style 属性、data-* 属性、<mark>、<table>、<details>、<iframe> などはそのまま残す。
export function sanitizeBlogHtml(html: string): string {
  if (!html) return "";
  return html
    // <script>…</script> と単独の <script ...>
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<script\b[^>]*\/?>/gi, "")
    // on* 属性（引用符あり／なし）
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "")
    // javascript: のURL
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
}
