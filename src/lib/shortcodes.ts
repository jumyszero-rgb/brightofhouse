// @/src/lib/shortcodes.ts
// ショートコード展開。本文HTML中の [[key]] を、DBに登録されたHTMLに置換する。
// 記述例: 記事やLPの本文に [[service-banner]] と書くと、そのショートコードのHTMLに展開される。
import prisma from "@/lib/prisma";

const SHORTCODE_RE = /\[\[\s*([A-Za-z0-9_-]+)\s*\]\]/g;

// キー→HTML のマップを取得（失敗しても空マップを返し、ページは壊さない）
export async function getShortcodeMap(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.shortcode.findMany();
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.html;
    return map;
  } catch {
    return {};
  }
}

// 与えられたマップで [[key]] を置換（同期）。エディタが <p>[[key]]</p> のように包んでいる場合も外側のpごと置換する。
export function applyShortcodes(html: string, map: Record<string, string>): string {
  if (!html) return html;
  if (Object.keys(map).length === 0) return html;
  // まず <p>[[key]]</p> / 段落単体を丸ごと置換（ブロック要素をpの中に残さないため）
  let out = html.replace(
    /<p[^>]*>\s*\[\[\s*([A-Za-z0-9_-]+)\s*\]\]\s*<\/p>/g,
    (m, key) => (map[key] !== undefined ? map[key] : m)
  );
  // 残りのインラインな [[key]] も置換
  out = out.replace(SHORTCODE_RE, (m, key) => (map[key] !== undefined ? map[key] : m));
  return out;
}

// 便利関数: 1つのHTMLを展開（マップ取得込み）
export async function expandShortcodes(html: string): Promise<string> {
  if (!html || !html.includes("[[")) return html;
  const map = await getShortcodeMap();
  return applyShortcodes(html, map);
}
