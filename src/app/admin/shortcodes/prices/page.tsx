// @/src/app/admin/shortcodes/prices/page.tsx
// 予約マスターの料金ショートコード一覧。
// 大分類 → 中分類 → 小分類 → オプション の順に並べ、各項目のショートコードをワンクリックでコピーできる。
// LPの本文（リッチテキスト・BlockNote・HTML）に貼ると、表示時に予約マスターの最新価格に置き換わる。
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { resolvePrice } from "@/lib/bookingMenuToBookingData";

type Opt = { id: string; title: string; price: number; discountPercent: number | null; discountRounding: string; priceFrom?: boolean };
type Sub = Opt & { webSpecialPrice: number | null; options: Opt[] };
type Menu = { id: string; title: string; basePrice: number; webSpecialPrice: number | null; discountPercent: number | null; discountRounding: string; priceFrom?: boolean; subMenus: Sub[]; options: Opt[] };
type Cat = { id: string; title: string; order: number; menus: Menu[] };

const yen = (n: number) => `${Math.round(n).toLocaleString("ja-JP")}円`;

function priceInfo(base: number, web: number | null, pct: number | null, rounding: string, from?: boolean) {
  if (!base && web == null) return { now: "お見積り", normal: "" };
  const p = resolvePrice(base, web, pct, rounding);
  return {
    now: `${yen(p.price)}${from ? "〜" : ""}`,
    normal: p.originalPrice != null && p.originalPrice !== p.price ? yen(p.originalPrice) : "",
  };
}

function CopyBtn({ code, label, copied, onCopy }: { code: string; label: string; copied: string | null; onCopy: (c: string) => void }) {
  const done = copied === code;
  return (
    <button
      type="button"
      onClick={() => onCopy(code)}
      title={code}
      className={`text-[11px] font-bold px-2 py-1 rounded border whitespace-nowrap transition-colors ${
        done ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
      }`}
    >
      {done ? "コピーしました" : label}
    </button>
  );
}

function Row({
  depth,
  kind,
  title,
  base,
  web,
  pct,
  rounding,
  from,
  codes,
  copied,
  onCopy,
}: {
  depth: number;
  kind: string;
  title: string;
  base: number;
  web: number | null;
  pct: number | null;
  rounding: string;
  from?: boolean;
  codes: { label: string; code: string }[];
  copied: string | null;
  onCopy: (c: string) => void;
}) {
  const p =
    kind === "中分類" && !base && web == null
      ? { now: "基本料金0円（単体価格・料金表には出しません）", normal: "" }
      : priceInfo(base, web, pct, rounding, from);
  const kindColor =
    kind === "中分類" ? "bg-blue-100 text-blue-700" : kind === "小分類" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700";
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 py-2 border-b last:border-b-0" style={{ paddingLeft: depth * 16 }}>
      <div className="flex-1 min-w-0">
        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mr-2 ${kindColor}`}>{kind}</span>
        <span className="text-sm font-bold text-slate-800">{title}</span>
        <span className="ml-3 text-sm">
          {p.normal && <s className="text-slate-400 text-xs mr-1">{p.normal}</s>}
          <b className="text-red-600">{p.now}</b>
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {codes.map((c) => (
          <CopyBtn key={c.code} code={c.code} label={c.label} copied={copied} onCopy={onCopy} />
        ))}
      </div>
    </div>
  );
}

export default function PriceShortcodesPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/booking-master", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setCats(Array.isArray(data) ? [...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : []))
      .catch(() => setError("予約マスターの読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  const onCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // クリップボードが使えない環境向け
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(code);
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500);
  };

  // 検索（項目名の部分一致。親が一致したら子も全部出す）
  const filtered = useMemo(() => {
    const k = q.trim();
    if (!k) return cats;
    const hit = (s: string) => s.includes(k);
    return cats
      .map((c) => {
        if (hit(c.title)) return c;
        const menus = (c.menus || [])
          .map((m) => {
            if (hit(m.title)) return m;
            const subMenus = (m.subMenus || [])
              .map((s) => (hit(s.title) ? s : { ...s, options: (s.options || []).filter((o) => hit(o.title)) }))
              .filter((s) => hit(s.title) || s.options.length);
            const options = (m.options || []).filter((o) => hit(o.title));
            return subMenus.length || options.length ? { ...m, subMenus, options } : null;
          })
          .filter(Boolean) as Menu[];
        return menus.length ? { ...c, menus } : null;
      })
      .filter(Boolean) as Cat[];
  }, [cats, q]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 text-black">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-800">料金ショートコード（予約マスター）</h1>
          <div className="flex gap-3 text-sm">
            <Link href="/admin/shortcodes" className="text-blue-600 hover:underline">← ショートコード管理</Link>
            <Link href="/admin/booking-master" className="text-blue-600 hover:underline">予約マスター</Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 text-sm text-gray-600 leading-relaxed space-y-1">
          <p>
            コピーしたショートコードをLPの本文（リッチテキスト・BlockNote・HTML）に貼ると、表示のときに予約マスターの<b>最新の価格</b>に置き換わります（税込・3桁区切り・「円」）。
            予約マスターで価格を変えて保存すると、LPもすぐ新しい価格になります。
          </p>
          <ul className="list-disc pl-5 text-xs text-gray-500 space-y-0.5">
            <li><b>単体価格</b>：「6,600円」／<b>両方の価格</b>：通常価格がある項目は「<s>9,800円</s> 6,600円」（無ければ単体と同じ）</li>
            <li><b>中分類一覧</b>：中分類名の見出し＋料金表（内容／価格）。「基本料金」→小分類（一回り小さく字下げ）の順。基本料金が0円の中分類は基本料金の行を出しません。表のショートコードは1行に単独で書いてください</li>
            <li><b>大分類一覧</b>：大分類の中の中分類ごとに、見出し＋料金表</li>
            <li>存在しないID（削除した項目など）は公開ページでは何も表示されず、プレビュー（?preview=true）では赤字で「ショートコードのIDが見つかりません」と出ます</li>
          </ul>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="項目名で絞り込み（例：浴室）"
          className="w-full md:w-96 p-2 border rounded-lg bg-white text-sm"
        />

        {loading && <p className="text-sm text-gray-500">読み込み中...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {filtered.map((c) => {
          const catCode = `[[category-list:${c.id}]]`;
          return (
            <div key={c.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 px-4 py-3 bg-slate-800 text-white">
                <p className="font-bold">
                  <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded mr-2">大分類</span>
                  {c.title}
                </p>
                <CopyBtn code={catCode} label="大分類一覧をコピー" copied={copied} onCopy={onCopy} />
              </div>
              <div className="px-4">
                {(c.menus || []).map((m) => {
                  const menuList = `[[menu-list:${m.id}]]`;
                  return (
                    <div key={m.id} className="py-1 border-b last:border-b-0">
                      <Row
                        depth={0}
                        kind="中分類"
                        title={m.title}
                        base={m.basePrice}
                        web={m.webSpecialPrice}
                        pct={m.discountPercent}
                        rounding={m.discountRounding}
                        from={m.priceFrom}
                        codes={[
                          { label: "単体価格", code: `[[price:menu:${m.id}]]` },
                          { label: "両方の価格", code: `[[price:menu:${m.id}:both]]` },
                          { label: "中分類一覧", code: menuList },
                          { label: "大分類一覧", code: catCode },
                        ]}
                        copied={copied}
                        onCopy={onCopy}
                      />
                      {(m.options || []).map((o) => (
                        <Row
                          key={o.id}
                          depth={1}
                          kind="オプション"
                          title={o.title}
                          base={o.price}
                          web={null}
                          pct={o.discountPercent}
                          rounding={o.discountRounding}
                          from={o.priceFrom}
                          codes={[
                            { label: "単体価格", code: `[[price:option:${o.id}]]` },
                            { label: "両方の価格", code: `[[price:option:${o.id}:both]]` },
                          ]}
                          copied={copied}
                          onCopy={onCopy}
                        />
                      ))}
                      {(m.subMenus || []).map((s) => (
                        <div key={s.id}>
                          <Row
                            depth={1}
                            kind="小分類"
                            title={s.title}
                            base={s.price}
                            web={s.webSpecialPrice}
                            pct={s.discountPercent}
                            rounding={s.discountRounding}
                            from={s.priceFrom}
                            codes={[
                              { label: "単体価格", code: `[[price:sub:${s.id}]]` },
                              { label: "両方の価格", code: `[[price:sub:${s.id}:both]]` },
                              { label: "中分類一覧", code: menuList },
                              { label: "大分類一覧", code: catCode },
                            ]}
                            copied={copied}
                            onCopy={onCopy}
                          />
                          {(s.options || []).map((o) => (
                            <Row
                              key={o.id}
                              depth={2}
                              kind="オプション"
                              title={o.title}
                              base={o.price}
                              web={null}
                              pct={o.discountPercent}
                              rounding={o.discountRounding}
                              from={o.priceFrom}
                              codes={[
                                { label: "単体価格", code: `[[price:option:${o.id}]]` },
                                { label: "両方の価格", code: `[[price:option:${o.id}:both]]` },
                              ]}
                              copied={copied}
                              onCopy={onCopy}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })}
                {(c.menus || []).length === 0 && <p className="text-xs text-gray-400 py-3">中分類がありません</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
