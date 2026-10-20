// @/src/lib/shortcodes.ts
// ショートコード展開。本文HTML中の [[...]] を置き換える。
//
// ① 登録ショートコード（/admin/shortcodes で登録）
//    [[service-banner]] → 登録したHTML
//
// ② 予約マスターの料金ショートコード（登録不要・IDで呼び出す。一覧とコピーは /admin/shortcodes/prices）
//    [[price:menu:中分類ID]]          → 「9,800円」
//    [[price:sub:小分類ID]]           → 「6,600円」
//    [[price:option:オプションID]]    → 「3,000円」
//    末尾に :both を付けると、通常価格がある項目は「<s>9,800円</s> 6,600円」
//    [[menu-list:中分類ID]]           → 中分類名の見出し＋料金表（内容／価格）
//    [[category-list:大分類ID]]       → 大分類の中の中分類ごとに、見出し＋料金表
//
//  - 金額は予約マスターの作り置き（serverMemo・persist）から読む。表示のたびにDBへは問い合わせない。
//    予約マスターを保存したとき（bustServerMemo）だけ入れ替わる。LP本文には金額を保存しない。
//  - 価格の計算はカレンダー予約フォームと同じ（WEB特価 → 個別値引き%）。税込・3桁区切り・「円」。
//  - 存在しないIDは何も出さない。プレビュー（preview: true）のときだけ赤字で「ショートコードのIDが見つかりません」。
import prisma from "@/lib/prisma";
import { memo } from "@/lib/serverMemo";
import { resolvePrice } from "@/lib/bookingMenuToBookingData";

const SHORTCODE_RE = /\[\[\s*([A-Za-z0-9_-]+)\s*\]\]/g;

// ===== ① 登録ショートコード =====

// キー→HTML のマップを取得（失敗しても空マップを返し、ページは壊さない）
export async function getShortcodeMap(opts?: { fresh?: boolean }): Promise<Record<string, string>> {
  try {
    // 作り置き（admin でショートコードを保存すると消える）
    const rows: { key: string; html: string }[] = await memo("shortcodes:all", () => prisma.shortcode.findMany(), {
      fresh: opts?.fresh,
    });
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.html;
    return map;
  } catch {
    return {};
  }
}

// ===== ② 予約マスターの料金 =====

type PriceFields = {
  id: string;
  title: string;
  durationMin: number;
  durationMax: number | null;
  discountPercent: number | null;
  discountRounding: string;
  priceFrom: boolean;
  order: number;
};
export type PmOption = PriceFields & { price: number };
export type PmSub = PriceFields & { price: number; webSpecialPrice: number | null; options: PmOption[] };
export type PmMenu = PriceFields & { basePrice: number; webSpecialPrice: number | null; subMenus: PmSub[]; options: PmOption[] };
export type PmCategory = { id: string; title: string; order: number; menus: PmMenu[] };

/** ショートコード置き換え用の予約マスター（索引つき） */
export type PriceIndex = {
  categories: Map<string, PmCategory>;
  menus: Map<string, PmMenu>;
  subs: Map<string, PmSub>;
  options: Map<string, PmOption>;
};

const priceSelect = {
  id: true,
  title: true,
  durationMin: true,
  durationMax: true,
  discountPercent: true,
  discountRounding: true,
  priceFrom: true,
  order: true,
} as const;

/** 予約マスター全体（料金表示に必要な項目だけ）。作り置きは予約マスター保存時にだけ入れ替わる */
export async function getPriceMaster(opts?: { fresh?: boolean }): Promise<PmCategory[]> {
  try {
    return await memo(
      "shortcodes:booking-master",
      () =>
        prisma.bookingCategory.findMany({
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            order: true,
            menus: {
              orderBy: { order: "asc" },
              select: {
                ...priceSelect,
                basePrice: true,
                webSpecialPrice: true,
                subMenus: {
                  orderBy: { order: "asc" },
                  select: {
                    ...priceSelect,
                    price: true,
                    webSpecialPrice: true,
                    options: { orderBy: { order: "asc" }, select: { ...priceSelect, price: true } },
                  },
                },
                options: { orderBy: { order: "asc" }, select: { ...priceSelect, price: true } },
              },
            },
          },
        }) as Promise<PmCategory[]>,
      { fresh: opts?.fresh, persist: true }
    );
  } catch {
    return [];
  }
}

export function buildPriceIndex(cats: PmCategory[]): PriceIndex {
  const idx: PriceIndex = { categories: new Map(), menus: new Map(), subs: new Map(), options: new Map() };
  for (const c of cats || []) {
    idx.categories.set(c.id, c);
    for (const m of c.menus || []) {
      idx.menus.set(m.id, m);
      for (const o of m.options || []) idx.options.set(o.id, o);
      for (const s of m.subMenus || []) {
        idx.subs.set(s.id, s);
        for (const o of s.options || []) idx.options.set(o.id, o);
      }
    }
  }
  return idx;
}

/** ページ1枚分の置き換えに必要なもの（登録ショートコード＋予約マスター）をまとめて取得 */
export type ShortcodeContext = { map: Record<string, string>; prices: PriceIndex; preview: boolean };
export async function getShortcodeContext(opts?: { preview?: boolean }): Promise<ShortcodeContext> {
  const fresh = !!opts?.preview;
  const [map, cats] = await Promise.all([getShortcodeMap({ fresh }), getPriceMaster({ fresh })]);
  return { map, prices: buildPriceIndex(cats), preview: fresh };
}

// --- 表示用 ---

const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const yen = (n: number) => `${Math.round(n).toLocaleString("ja-JP")}円`;

/** 価格（カレンダー予約フォームと同じ計算）。base が 0 のときは見積扱い */
function priceOf(x: { discountPercent: number | null; discountRounding: string; priceFrom: boolean }, base: number, webSpecialPrice: number | null) {
  const p = resolvePrice(base, webSpecialPrice, x.discountPercent, x.discountRounding);
  return { price: p.price, original: p.originalPrice, from: !!x.priceFrom, estimate: !base && webSpecialPrice == null };
}
type Price = ReturnType<typeof priceOf>;

function priceText(p: Price, both: boolean): string {
  if (p.estimate) return "お見積り";
  const cur = `${yen(p.price)}${p.from ? "〜" : ""}`;
  if (both && p.original != null && p.original !== p.price) return `<s>${yen(p.original)}</s> ${cur}`;
  return cur;
}

function fmtMin(m: number): string {
  if (m < 60) return `${m}分`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}時間${r}分` : `${h}時間`;
}
function durationText(min: number, max: number | null): string {
  if (!min && !max) return "";
  if (max && max !== min) return `目安 ${fmtMin(min)}〜${fmtMin(max)}`;
  return `目安 ${fmtMin(min || max || 0)}`;
}

// 表はインラインstyleで組む（記事の prose や <details> の中でも崩れない・CSSの読み込み順に左右されない）
const TD = "padding:.6em .7em;border-bottom:1px solid #e2e8f0;vertical-align:top;";
const TH = "padding:.5em .7em;border-bottom:2px solid #cbd5e1;background:#f8fafc;font-weight:700;font-size:.85em;color:#475569;";

/**
 * 表の1行。level="menu"（中分類の基本料金）は大きめ・太字、level="sub"（小分類）は一回り小さく字下げ。
 */
function row(name: string, sub: string, p: Price, level: "menu" | "sub"): string {
  const isSub = level === "sub";
  const nameStyle = isSub ? "font-weight:600;color:#334155;font-size:.9em;" : "font-weight:800;color:#0f172a;font-size:1em;";
  const priceSize = isSub ? ".95em" : "1.1em";
  const priceCell = p.estimate
    ? `<span style="font-weight:800;color:#0f172a;font-size:${priceSize}">お見積り</span>`
    : `${p.original != null && p.original !== p.price ? `<s style="color:#94a3b8;font-size:.8em">${yen(p.original)}</s><br>` : ""}<span style="font-weight:800;color:#dc2626;font-size:${priceSize}">${yen(p.price)}${p.from ? "〜" : ""}</span>`;
  return (
    `<tr>` +
    `<td style="${TD}word-break:break-word;overflow-wrap:anywhere;${isSub ? "padding-left:1.4em;" : ""}">` +
    (isSub ? `<span style="color:#94a3b8;font-size:.85em;margin-left:-.9em;margin-right:.2em;">└</span>` : "") +
    `<span style="${nameStyle}">${esc(name)}</span>` +
    (sub ? `<br><span style="font-size:.75em;color:#64748b">${esc(sub)}</span>` : "") +
    `</td>` +
    `<td style="${TD}text-align:right;white-space:nowrap;">${priceCell}</td>` +
    `</tr>`
  );
}

/** 中分類の基本料金が0円（WEB特価も無し）か。0円の基本料金は表示しない */
const menuBaseIsZero = (m: PmMenu) => !m.basePrice && m.webSpecialPrice == null;

/** 中分類の料金表（見出し＋表）。基本料金（0円なら出さない）→ 小分類 の順。行が1つも無ければ空 */
function menuListHtml(m: PmMenu): string {
  const rows: string[] = [];
  const hasSubs = (m.subMenus || []).length > 0;
  // 中分類そのものの料金（小分類があるときは「基本料金」として先頭に出す）
  if (!menuBaseIsZero(m)) {
    rows.push(row(hasSubs ? `${m.title}（基本料金）` : m.title, durationText(m.durationMin, m.durationMax), priceOf(m, m.basePrice, m.webSpecialPrice), "menu"));
  }
  for (const s of m.subMenus || []) {
    rows.push(row(s.title, durationText(s.durationMin, s.durationMax), priceOf(s, s.price, s.webSpecialPrice), "sub"));
  }
  if (!rows.length) return "";
  return (
    `<div class="bh-price-list" style="margin:1.2em 0;">` +
    `<h3 style="font-size:1.05em;font-weight:800;margin:0 0 .5em;color:#0f172a;">${esc(m.title)}</h3>` +
    `<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%;">` +
    `<table style="width:100%;border-collapse:collapse;table-layout:auto;margin:0;font-size:.95em;background:#fff;">` +
    `<thead><tr><th style="${TH}text-align:left;">内容</th><th style="${TH}text-align:right;white-space:nowrap;">価格（税込）</th></tr></thead>` +
    `<tbody>${rows.join("")}</tbody>` +
    `</table></div></div>`
  );
}

function categoryListHtml(c: PmCategory): string {
  const parts = (c.menus || []).map(menuListHtml).filter(Boolean);
  if (!parts.length) return "";
  return `<div class="bh-price-category">${parts.join("")}</div>`;
}

function notFound(code: string, preview: boolean): string {
  return preview
    ? `<span style="color:#dc2626;font-weight:700;">［ショートコードのIDが見つかりません：${esc(code)}］</span>`
    : "";
}

// [[price:menu:ID]] / [[price:sub:ID:both]] / [[menu-list:ID]] / [[category-list:ID]]
const PRICE_INNER = String.raw`(price|menu-list|category-list)\s*:\s*([A-Za-z0-9_:-]+?)`;
const PRICE_RE = new RegExp(String.raw`\[\[\s*${PRICE_INNER}\s*\]\]`, "g");
// 一覧は表（ブロック要素）なので、<p>[[menu-list:ID]]</p> のように段落だけで書かれていたら段落ごと置き換える
const LIST_PARA_RE = /<p\b[^>]*>\s*(?:<[a-z]+\b[^>]*>\s*)*\[\[\s*(menu-list|category-list)\s*:\s*([A-Za-z0-9_-]+)\s*\]\]\s*(?:<\/[a-z]+>\s*)*<\/p>/g;

function renderPriceCode(kind: string, arg: string, prices: PriceIndex, preview: boolean): string {
  const code = `${kind}:${arg}`;
  if (kind === "menu-list") {
    const m = prices.menus.get(arg);
    if (!m) return notFound(code, preview);
    return menuListHtml(m) || (preview ? `<span style="color:#dc2626;font-weight:700;">［表示できる料金がありません（基本料金0円・小分類なし）：${esc(code)}］</span>` : "");
  }
  if (kind === "category-list") {
    const c = prices.categories.get(arg);
    const html = c ? categoryListHtml(c) : "";
    return html || notFound(code, preview);
  }
  // price:種類:ID[:both]
  const parts = arg.split(":");
  const type = parts[0];
  const id = parts[1] || "";
  const both = parts[2] === "both";
  if (type === "menu") {
    const m = prices.menus.get(id);
    if (!m) return notFound(code, preview);
    // 基本料金0円の中分類は何も出さない（プレビューでは理由を表示）
    if (menuBaseIsZero(m)) return preview ? `<span style="color:#dc2626;font-weight:700;">［この中分類は基本料金が0円のため表示しません：${esc(code)}］</span>` : "";
    return priceText(priceOf(m, m.basePrice, m.webSpecialPrice), both);
  }
  if (type === "sub") {
    const s = prices.subs.get(id);
    return s ? priceText(priceOf(s, s.price, s.webSpecialPrice), both) : notFound(code, preview);
  }
  if (type === "option") {
    const o = prices.options.get(id);
    return o ? priceText(priceOf(o, o.price, null), both) : notFound(code, preview);
  }
  return notFound(code, preview);
}

// ===== 置き換え本体 =====

/**
 * 与えられたマップで [[key]] を置換（同期）。エディタが <p>[[key]]</p> のように包んでいる場合も外側のpごと置換する。
 * opts.prices を渡すと、予約マスターの料金ショートコードも置き換える（getShortcodeContext で取得）。
 */
export function applyShortcodes(
  html: string,
  map: Record<string, string>,
  opts?: { prices?: PriceIndex; preview?: boolean }
): string {
  if (!html || !html.includes("[[")) return html;
  let out = html;

  // ② 予約マスターの料金
  if (opts?.prices) {
    const prices = opts.prices;
    const preview = !!opts.preview;
    out = out.replace(LIST_PARA_RE, (_m, kind, id) => renderPriceCode(kind, id, prices, preview));
    out = out.replace(PRICE_RE, (_m, kind, arg) => renderPriceCode(kind, arg, prices, preview));
  }

  // ① 登録ショートコード
  if (Object.keys(map).length > 0) {
    // まず <p>[[key]]</p> / 段落単体を丸ごと置換（ブロック要素をpの中に残さないため）
    out = out.replace(
      /<p[^>]*>\s*\[\[\s*([A-Za-z0-9_-]+)\s*\]\]\s*<\/p>/g,
      (m, key) => (map[key] !== undefined ? map[key] : m)
    );
    // 残りのインラインな [[key]] も置換
    out = out.replace(SHORTCODE_RE, (m, key) => (map[key] !== undefined ? map[key] : m));
  }
  return out;
}

/** コンテキスト（getShortcodeContext の戻り値）でまとめて置き換える */
export function applyShortcodesWith(html: string, ctx: ShortcodeContext): string {
  return applyShortcodes(html, ctx.map, { prices: ctx.prices, preview: ctx.preview });
}

// 便利関数: 1つのHTMLを展開（マップ・予約マスター取得込み）
export async function expandShortcodes(html: string, opts?: { preview?: boolean }): Promise<string> {
  if (!html || !html.includes("[[")) return html;
  const ctx = await getShortcodeContext(opts);
  return applyShortcodesWith(html, ctx);
}
