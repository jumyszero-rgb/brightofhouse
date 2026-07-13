// @/src/lib/extractToc.ts
// リッチテキスト(HTML文字列)からH2見出しを抽出し、各見出しにid属性を付与する。
// ページ本文の先頭に目次(目次リンク一覧)を表示するために使う。
// H3まで含めると項目数が多くなりすぎるため、目次にはH2のみを表示する
// （H3にもアンカー用のidは付与しておき、将来的な深いリンクに備える）。

export type TocItem = { id: string; text: string; level: 2 };

export function extractToc(html: string): { html: string; toc: TocItem[] } {
  if (!html) return { html, toc: [] };

  let counter = 0;
  const toc: TocItem[] = [];

  const withIds = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g, (match, level, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    if (!text) return match;
    // 電話番号など、数字・記号のみの見出しは装飾目的（CTAの大きな電話番号表示など）とみなし目次から除外する
    if (!/[^\d\-‐‑‒–—―ー\s()（）]/.test(text)) return match;
    counter++;
    const id = `toc-${counter}`;
    if (level === "2") toc.push({ id, text, level: 2 });
    // 既にid属性が付いている場合は上書きしない
    if (/\sid=/.test(attrs)) return match;
    return `<h${level} id="${id}"${attrs}>${inner}</h${level}>`;
  });

  return { html: withIds, toc };
}
