// @/src/lib/splitArticle.ts
// 本文HTMLを見出し(既定はH3、無ければH2)ごとに分割する。
// 各セクションは「見出し」＋「本文」に分かれ、詳細ページで
// 見出しを常時表示・本文を最初の2行だけ表示（続きを読むで展開）に使う。

export type ArticleSection = {
  id: string;          // 見出しのid（アンカー用。無ければ生成）
  headingHtml: string; // <h3 ...>...</h3> をそのまま
  bodyHtml: string;    // 次の見出しまでの本文HTML
};

export type SplitArticle = {
  preambleHtml: string;        // 最初の見出しより前（導入文など）
  sections: ArticleSection[];
  tag: "h3" | "h2" | null;     // 分割に使った見出しレベル
};

function splitByTag(html: string, tag: "h2" | "h3"): { preambleHtml: string; sections: ArticleSection[] } {
  const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "g");
  const matches: { html: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    matches.push({ html: m[0], start: m.index, end: m.index + m[0].length });
  }
  if (matches.length === 0) return { preambleHtml: html, sections: [] };

  const preambleHtml = html.slice(0, matches[0].start);
  const sections: ArticleSection[] = matches.map((cur, i) => {
    const next = matches[i + 1];
    const bodyHtml = html.slice(cur.end, next ? next.start : html.length);
    const idMatch = cur.html.match(/\sid="([^"]+)"/);
    const id = idMatch ? idMatch[1] : `sec-${i + 1}`;
    return { id, headingHtml: cur.html, bodyHtml };
  });
  return { preambleHtml, sections };
}

export function splitArticle(html: string): SplitArticle {
  if (!html) return { preambleHtml: "", sections: [], tag: null };

  // 既定はH3で分割。H3が無ければH2で分割。どちらも無ければ分割なし。
  const byH3 = splitByTag(html, "h3");
  if (byH3.sections.length > 0) return { ...byH3, tag: "h3" };

  const byH2 = splitByTag(html, "h2");
  if (byH2.sections.length > 0) return { ...byH2, tag: "h2" };

  return { preambleHtml: html, sections: [], tag: null };
}
