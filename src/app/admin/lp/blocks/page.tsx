// @/src/app/admin/lp/blocks/page.tsx
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import RichTextEditor from "@/components/RichTextEditor";
import dynamic from "next/dynamic";
import { MENU_BUTTON_DEFAULTS } from "@/lib/lpMenuButtons";

const BlockNoteBody = dynamic(() => import("@/components/lp/BlockNoteBody"), {
  ssr: false,
  loading: () => <div className="p-4 text-sm text-gray-400">エディタ読み込み中...</div>,
});

type Block = { id: string; type: string; visible?: boolean; data: any; refs?: any; fold?: { enabled?: boolean; title?: string; open?: boolean } };
type MenuRef = { refType: string; refId: string };
const MENU_BUTTON_KEYS = ["lead", "booking", "phone", "line"] as const;
const MENU_BUTTON_NAMES: Record<(typeof MENU_BUTTON_KEYS)[number], string> = {
  lead: "簡易申込フォームへ",
  booking: "カレンダー予約へ",
  phone: "電話",
  line: "LINE",
};

const BLOCK_TYPES: { type: string; label: string }[] = [
  { type: "hero", label: "ヒーロー" },
  { type: "blocknote", label: "テキスト(本文・BlockNote)" },
  { type: "html", label: "HTML(自由埋め込み)" },
  { type: "image", label: "画像" },
  { type: "seasonal", label: "季節のおすすめ(月替り)" },
  { type: "masterMenu", label: "メニュー(予約マスター連動)" },
  { type: "cta", label: "CTAボタン" },
  { type: "leadForm", label: "申込フォーム(軽量)" },
  { type: "bookingForm", label: "カレンダー予約フォーム" },
  // ↓ リッチLPに近いブロック
  { type: "pains", label: "お悩み（チェックリスト）" },
  { type: "recommended", label: "おすすめ人気メニュー" },
  { type: "reasons", label: "選ばれる理由" },
  { type: "beforeAfter", label: "施工事例（ビフォーアフター）" },
  { type: "steps", label: "ご利用の流れ" },
  { type: "voices", label: "お客様の声（口コミ）" },
  { type: "assurance", label: "安心の理由・対応エリア" },
  { type: "faq", label: "よくあるご質問" },
];

function newBlock(type: string): Block {
  const id = crypto.randomUUID();
  switch (type) {
    case "hero": return { id, type, visible: true, data: { eyebrow: "", title: "", subtitle: "", priceLead: "", imageUrl: "" } };
    case "richText": return { id, type, visible: true, data: { heading: "", body: "" } };
    case "image": return { id, type, visible: true, data: { imageUrl: "", caption: "" } };
    case "blocknote": return { id, type, visible: true, data: { blocks: [] } };
    case "seasonal": return { id, type, visible: true, data: { entries: {} } };
    case "masterMenu": return {
      id, type, visible: true,
      data: {
        showDesc: true, heading: "", introHtml: "", outroHtml: "",
        buttons: { lead: { show: true, label: "" }, booking: { show: true, label: "" }, phone: { show: true, label: "" }, line: { show: true, label: "" } },
      },
      refs: { refType: "menu", refId: "", items: [] },
    };
    case "cta": return { id, type, visible: true, data: { label: "お問い合わせはこちら", targetType: "form", targetValue: "" } };
    case "leadForm": return { id, type, visible: true, data: { heading: "無料相談・お見積り", note: "30秒で送信できます" } };
    case "bookingForm": return { id, type, visible: true, data: { heading: "ご希望日時から仮予約・お見積り" }, refs: { refType: "category", refId: "", refIds: [] } };
    case "html": return { id, type, visible: true, data: { html: "", fullWidth: false } };
    case "pains": return { id, type, visible: true, data: { heading: "こんなお悩みありませんか？", items: [], showCta: true, ctaTitle: "" } };
    case "recommended": return { id, type, visible: true, data: { heading: "おすすめ人気メニュー", sub: "ご依頼の多い人気のメニューです", items: [] } };
    case "reasons": return { id, type, visible: true, data: { heading: "選ばれる理由", items: [] } };
    case "beforeAfter": return { id, type, visible: true, data: { heading: "施工事例（札幌の実績）", ids: [] } };
    case "steps": return { id, type, visible: true, data: { heading: "ご利用の流れ", items: [] } };
    case "voices": return { id, type, visible: true, data: { heading: "お客様の声", servicePageIds: [], items: [], showRating: true, limit: 0 } };
    case "assurance": return { id, type, visible: true, data: { showAssurance: true, assuranceHeading: "安心の理由", showArea: true, areaHeading: "対応エリア" } };
    case "faq": return { id, type, visible: true, data: { heading: "よくあるご質問", servicePageIds: [], items: [] } };
    default: return { id, type, visible: true, data: {} };
  }
}

function BlocksBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lpId = searchParams.get("id");

  const [meta, setMeta] = useState<{ title: string; slug: string; status: string } | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [master, setMaster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [editMonths, setEditMonths] = useState<Record<string, number>>({});
  // masterMenuブロックの絞り込み選択（ブロックidごとに 大分類/中分類 を保持）
  const [mmFilter, setMmFilter] = useState<Record<string, { cat?: string; menu?: string }>>({});

  // 新規作成用
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");

  // 口コミ・FAQの連動先（サービス詳細ページ）と、施工事例の一覧
  const [servicePages, setServicePages] = useState<{ id: string; title: string; slug: string }[]>([]);
  const [beforeAfters, setBeforeAfters] = useState<{ id: string; title: string; afterUrl: string }[]>([]);

  useEffect(() => {
    fetch("/api/booking-master").then((r) => r.ok ? r.json() : []).then(setMaster).catch(() => {});
    fetch("/api/service-pages").then((r) => r.ok ? r.json() : []).then((v) => setServicePages(Array.isArray(v) ? v : [])).catch(() => {});
    fetch("/api/before-after").then((r) => r.ok ? r.json() : []).then((v) => setBeforeAfters(Array.isArray(v) ? v : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!lpId) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/lp?id=${lpId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setMeta({ title: data.title, slug: data.slug, status: data.status });
          setBlocks(Array.isArray(data.blocks) ? data.blocks : []);
        }
      })
      .finally(() => setLoading(false));
  }, [lpId]);

  // 予約マスターの平坦化（セレクタ用）
  const flat = useMemo(() => {
    const menus: { id: string; label: string; price: number }[] = [];
    const subMenus: { id: string; label: string; price: number }[] = [];
    const options: { id: string; label: string; price: number }[] = [];
    for (const cat of master || []) {
      for (const menu of cat.menus || []) {
        menus.push({ id: menu.id, label: `${cat.title} > ${menu.title}`, price: menu.basePrice });
        for (const opt of menu.options || []) {
          options.push({ id: opt.id, label: `${cat.title} > ${menu.title} > [直下] ${opt.title}`, price: opt.price });
        }
        for (const sub of menu.subMenus || []) {
          subMenus.push({ id: sub.id, label: `${cat.title} > ${menu.title} > ${sub.title}`, price: sub.price });
          for (const opt of sub.options || []) {
            options.push({ id: opt.id, label: `${cat.title} > ${menu.title} > ${sub.title} > ${opt.title}`, price: opt.price });
          }
        }
      }
    }
    const categories = (master || []).map((c: any) => ({ id: c.id, title: c.title }));
    return { menus, subMenus, options, categories };
  }, [master]);

  const update = (idx: number, patch: Partial<Block>) =>
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  const updateData = (idx: number, patch: any) =>
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, data: { ...b.data, ...patch } } : b)));
  const updateRefs = (idx: number, patch: any) =>
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, refs: { ...(b.refs || {}), ...patch } } : b)));
  const updateEntry = (idx: number, month: number, patch: any) =>
    setBlocks((prev) => prev.map((b, i) => {
      if (i !== idx) return b;
      const entries = { ...((b.data && b.data.entries) || {}) };
      entries[String(month)] = { ...(entries[String(month)] || {}), ...patch };
      return { ...b, data: { ...b.data, entries } };
    }));
  const move = (idx: number, dir: -1 | 1) =>
    setBlocks((prev) => {
      const arr = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return prev;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return arr;
    });
  const remove = (idx: number) => setBlocks((prev) => prev.filter((_, i) => i !== idx));
  const add = (type: string) => setBlocks((prev) => [...prev, newBlock(type)]);

  const uploadImage = async (file: File, idx: number) => {
    const fd = new FormData();
    fd.set("image", file);
    const res = await fetch("/api/lp/upload", { method: "POST", body: fd });
    if (res.ok) { const { url } = await res.json(); updateData(idx, { imageUrl: url }); }
    else setMsg("画像アップロードに失敗しました");
  };

  const save = async () => {
    if (!lpId) return;
    setSaving(true); setMsg("");
    const res = await fetch("/api/lp", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lpId, blocks }),
    });
    setSaving(false);
    setMsg(res.ok ? "保存しました" : "保存に失敗しました");
  };

  // タイトル・URL(slug)の変更（ブロック編集画面の中で完結。旧「編集」画面に行かなくてよい）
  const [editMeta, setEditMeta] = useState<{ title: string; slug: string } | null>(null);
  const saveMeta = async () => {
    if (!lpId || !editMeta) return;
    const res = await fetch("/api/lp", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lpId, title: editMeta.title, slug: editMeta.slug }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data?.error || "変更に失敗しました"); return; }
    setMeta((m) => (m ? { ...m, title: data.title, slug: data.slug } : m));
    setEditMeta(null);
    setMsg("タイトル・URLを変更しました");
  };

  const setStatus = async (status: string) => {
    if (!lpId) return;
    const res = await fetch("/api/lp", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lpId, status }),
    });
    if (res.ok) setMeta((m) => (m ? { ...m, status } : m));
  };

  const createNew = async () => {
    if (!newTitle || !newSlug) { setMsg("タイトルとURL(slug)を入力してください"); return; }
    const fd = new FormData();
    fd.set("title", newTitle);
    fd.set("slug", newSlug);
    fd.set("status", "DRAFT");
    fd.set("category", "CAMPAIGN");
    fd.set("templateStyle", "BLOCKS");
    const res = await fetch("/api/lp", { method: "POST", body: fd });
    if (res.ok) {
      const created = await res.json();
      router.replace(`/admin/lp/blocks?id=${created.id}`);
    } else {
      setMsg("作成に失敗しました（slugが重複している可能性があります）");
    }
  };

  if (loading) return <div className="p-8 text-black">読み込み中...</div>;

  // 新規作成画面（idなし）
  if (!lpId) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-black">
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-6 border">
          <h1 className="text-xl font-bold mb-4">新規ブロックLPを作成</h1>
          <label className="block text-sm font-bold mb-1">ページタイトル（H1／予約カテゴリ名と一致推奨）</label>
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full p-3 border rounded-lg mb-3" placeholder="例：お風呂クリーニング" />
          <label className="block text-sm font-bold mb-1">URL (slug)</label>
          <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} className="w-full p-3 border rounded-lg mb-4" placeholder="例：test-bath-lp" />
          <div className="flex gap-2">
            <button onClick={createNew} className="bg-blue-600 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-blue-700">作成してブロック編集へ</button>
            <Link href="/admin/lp" className="bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-lg">戻る</Link>
          </div>
          {msg && <p className="text-sm text-red-600 mt-3">{msg}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-xl shadow p-4 border mb-4 flex flex-wrap items-center gap-3 justify-between sticky top-2 z-20">
          <div>
            {editMeta ? (
              <div className="space-y-1.5">
                <input
                  className="w-full p-1.5 border rounded text-sm font-bold"
                  value={editMeta.title}
                  onChange={(e) => setEditMeta({ ...editMeta, title: e.target.value })}
                  placeholder="ページタイトル"
                />
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-500">/lp/</span>
                  <input
                    className="flex-1 min-w-0 p-1.5 border rounded text-xs font-mono"
                    value={editMeta.slug}
                    onChange={(e) => setEditMeta({ ...editMeta, slug: e.target.value.trim().toLowerCase() })}
                    placeholder="例：mizumawari-house"
                  />
                </div>
                {meta?.status === "PUBLISHED" && editMeta.slug !== meta?.slug && (
                  <p className="text-[11px] text-red-600">※公開中のLPです。URLを変えると、今のURL（広告のリンク先など）は表示されなくなります。</p>
                )}
                <div className="flex gap-2">
                  <button onClick={saveMeta} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700">変更を保存</button>
                  <button onClick={() => setEditMeta(null)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-bold">やめる</button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-lg font-bold">ブロック編集：{meta?.title}</h1>
                <p className="text-xs text-gray-500">
                  /lp/{meta?.slug}　状態：{meta?.status === "PUBLISHED" ? "公開中" : "下書き"}
                  <button
                    onClick={() => meta && setEditMeta({ title: meta.title, slug: meta.slug })}
                    className="ml-2 text-blue-600 font-bold hover:underline"
                  >
                    タイトル・URLを変更
                  </button>
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a href={`/lp/${meta?.slug}?preview=true`} target="_blank" className="bg-amber-100 text-amber-700 px-3 py-2 rounded text-sm font-bold hover:bg-amber-200">プレビュー</a>
            {meta?.status === "PUBLISHED"
              ? <button onClick={() => setStatus("DRAFT")} className="bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-bold">下書きに戻す</button>
              : <button onClick={() => setStatus("PUBLISHED")} className="bg-green-600 text-white px-3 py-2 rounded text-sm font-bold hover:bg-green-700">公開する</button>}
            <button onClick={save} disabled={saving} className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-bold hover:bg-blue-700 disabled:bg-gray-400">{saving ? "保存中..." : "保存"}</button>
          </div>
        </div>
        {msg && <p className="text-sm font-bold text-center mb-3 text-blue-700">{msg}</p>}

        {/* ブロック一覧 */}
        <div className="space-y-3">
          {blocks.map((b, idx) => (
            <div key={b.id} className="bg-white rounded-xl shadow border">
              <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-50 rounded-t-xl">
                <span className="text-sm font-bold text-slate-700">
                  {BLOCK_TYPES.find((t) => t.type === b.type)?.label || b.type}
                  {b.fold?.enabled && b.fold?.title && <span className="ml-2 text-xs font-bold text-indigo-600">［折りたたみ：{b.fold.title}］</span>}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => move(idx, -1)} className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 text-sm">↑</button>
                  <button onClick={() => move(idx, 1)} className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 text-sm">↓</button>
                  <label className="text-xs flex items-center gap-1 ml-2">
                    <input type="checkbox" checked={b.visible !== false} onChange={(e) => update(idx, { visible: e.target.checked })} />表示
                  </label>
                  <button onClick={() => remove(idx)} className="ml-2 text-red-500 text-xs font-bold hover:underline">削除</button>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {renderEditor(b, idx)}
                {b.type !== "hero" && renderFoldEditor(b, idx)}
              </div>
            </div>
          ))}
          {blocks.length === 0 && <p className="text-center text-gray-400 py-8">下の「＋」でブロックを追加してください。</p>}
        </div>

        {/* ブロック追加 */}
        <div className="mt-5 bg-white rounded-xl shadow border p-4">
          <p className="text-sm font-bold mb-2">＋ ブロックを追加</p>
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map((t) => (
              <button key={t.type} onClick={() => add(t.type)} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-100">＋ {t.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // 公開ページで「見出しだけ表示 → タップで開く」にする設定（ヒーロー以外の全ブロック共通）
  function renderFoldEditor(b: Block, idx: number) {
    const f = b.fold || {};
    const setFold = (patch: Partial<NonNullable<Block["fold"]>>) => update(idx, { fold: { ...f, ...patch } });
    return (
      <div className="mt-3 pt-3 border-t border-dashed space-y-2">
        <label className="text-xs font-bold flex items-center gap-1 text-indigo-700">
          <input type="checkbox" checked={!!f.enabled} onChange={(e) => setFold({ enabled: e.target.checked })} />
          公開ページで折りたたむ（見出しだけ表示して、タップで開く）
        </label>
        {f.enabled && (
          <div className="pl-5 space-y-2">
            <input
              className="w-full p-2 border rounded-lg text-sm"
              placeholder="折りたたみの見出し（例：料金・メニュー）※必須。空欄だと折りたたまずに表示します"
              value={f.title || ""}
              onChange={(e) => setFold({ title: e.target.value })}
            />
            <label className="text-xs flex items-center gap-1">
              <input type="checkbox" checked={!!f.open} onChange={(e) => setFold({ open: e.target.checked })} />
              最初から開いた状態にする
            </label>
            <p className="text-[11px] text-gray-400">※中の文章は閉じていても検索エンジンには読まれます。ボタンでこのブロック内のフォームへ飛んだときは自動で開きます。</p>
          </div>
        )}
      </div>
    );
  }

  function renderEditor(b: Block, idx: number) {
    const d = b.data || {};
    const inputCls = "w-full p-2 border rounded-lg text-sm";
    if (b.type === "blocknote") {
      return (
        <div className="border rounded-lg bg-white">
          <BlockNoteBody value={d.blocks} onChange={({ blocks, html }) => updateData(idx, { blocks, html })} />
          <p className="text-[11px] text-gray-400 p-2">※ブロックを右端へドラッグすると横並び（段組み）にできます。「/」でメニュー、選択で装飾。</p>
        </div>
      );
    }
    if (b.type === "hero") {
      const common = d.useCommon !== false;
      const stats = Array.isArray(d.stats) && d.stats.length ? d.stats : [{ value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }];
      const setStat = (i: number, patch: any) => { const arr = [0, 1, 2, 3].map((k) => ({ ...(stats[k] || {}) })); arr[i] = { ...arr[i], ...patch }; updateData(idx, { stats: arr }); };
      return (
        <>
          <input className={inputCls} placeholder="小見出し(eyebrow)" value={d.eyebrow || ""} onChange={(e) => updateData(idx, { eyebrow: e.target.value })} />
          <input className={inputCls} placeholder="メインタイトル" value={d.title || ""} onChange={(e) => updateData(idx, { title: e.target.value })} />
          <input className={inputCls} placeholder="サブコピー" value={d.subtitle || ""} onChange={(e) => updateData(idx, { subtitle: e.target.value })} />
          <input className={inputCls} placeholder="価格リード(例: 3点セット ¥26,460〜)" value={d.priceLead || ""} onChange={(e) => updateData(idx, { priceLead: e.target.value })} />
          <ImageField url={d.imageUrl} onPick={(f) => uploadImage(f, idx)} />
          <label className="text-xs flex items-center gap-1 mt-1"><input type="checkbox" checked={common} onChange={(e) => updateData(idx, { useCommon: e.target.checked })} />評価・バッジ・実績バー・CTA・受付文言を「共通設定」にする</label>
          {!common && (
            <div className="mt-2 p-3 bg-slate-50 rounded-lg border space-y-2">
              <p className="text-[11px] font-bold text-slate-500">このLP独自の設定（共通OFF時のみ）</p>
              <input className={inputCls} placeholder="評価ラベル（例：★4.9）" value={d.ratingLabel || ""} onChange={(e) => updateData(idx, { ratingLabel: e.target.value })} />
              <input className={inputCls} placeholder="評価の補足（例：Google・ミツモア）" value={d.ratingNote || ""} onChange={(e) => updateData(idx, { ratingNote: e.target.value })} />
              <input className={inputCls} placeholder="信頼バッジ（カンマ区切り）" value={typeof d.badges === "string" ? d.badges : (Array.isArray(d.badges) ? d.badges.join(",") : "")} onChange={(e) => updateData(idx, { badges: e.target.value })} />
              <input className={inputCls} placeholder="電話番号" value={d.phone || ""} onChange={(e) => updateData(idx, { phone: e.target.value })} />
              <input className={inputCls} placeholder="LINE URL（空欄でLINEボタン非表示）" value={d.lineUrl !== undefined ? d.lineUrl : ""} onChange={(e) => updateData(idx, { lineUrl: e.target.value })} />
              <input className={inputCls} placeholder="受付文言（例：受付 9:00〜18:00 / お見積り無料）" value={d.note || ""} onChange={(e) => updateData(idx, { note: e.target.value })} />
              <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={d.showStats !== false} onChange={(e) => updateData(idx, { showStats: e.target.checked })} />実績数字バーを表示する</label>
              {d.showStats !== false && [0, 1, 2, 3].map((i) => (
                <div key={i} className="flex gap-2">
                  <input className={inputCls} placeholder={`実績${i + 1} 数値`} value={stats[i]?.value || ""} onChange={(e) => setStat(i, { value: e.target.value })} />
                  <input className={inputCls} placeholder="ラベル" value={stats[i]?.label || ""} onChange={(e) => setStat(i, { label: e.target.value })} />
                </div>
              ))}
            </div>
          )}
        </>
      );
    }
    if (b.type === "richText") {
      return (
        <>
          <input className={inputCls} placeholder="見出し" value={d.heading || ""} onChange={(e) => updateData(idx, { heading: e.target.value })} />
          <select className={inputCls} value={d.boxStyle || "none"} onChange={(e) => updateData(idx, { boxStyle: e.target.value })}>
            <option value="none">囲み枠：なし（通常）</option>
            <option value="card">白カード枠</option>
            <option value="info">青枠</option>
            <option value="warning">赤枠（注意）</option>
            <option value="highlight">アンバー枠（強調）</option>
            <option value="green">緑枠</option>
          </select>
          <div className="border rounded-lg">
            <RichTextEditor key={b.id} value={d.body || ""} onChange={(html) => updateData(idx, { body: html })} />
          </div>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={!!d.collapsible} onChange={(e) => updateData(idx, { collapsible: e.target.checked })} />この本文を折り畳んで表示する</label>
          {d.collapsible && <input className={inputCls} placeholder="折り畳みのラベル（例：詳しく見る）" value={d.summaryLabel || ""} onChange={(e) => updateData(idx, { summaryLabel: e.target.value })} />}
        </>
      );
    }
    if (b.type === "image") {
      return (
        <>
          <ImageField url={d.imageUrl} onPick={(f) => uploadImage(f, idx)} />
          <input className={inputCls} placeholder="キャプション（任意）" value={d.caption || ""} onChange={(e) => updateData(idx, { caption: e.target.value })} />
        </>
      );
    }
    if (b.type === "masterMenu") {
      // 選んだ項目（複数）。旧データ（refType/refId の1件だけ）も読めるようにする
      const items: MenuRef[] = Array.isArray(b.refs?.items) && b.refs.items.length
        ? b.refs.items
        : (b.refs?.refId ? [{ refType: b.refs.refType || "menu", refId: b.refs.refId }] : []);
      const setItems = (next: MenuRef[]) =>
        updateRefs(idx, { items: next, refType: next[0]?.refType || "menu", refId: next[0]?.refId || "" });
      const labelOf = (it: MenuRef) =>
        (it.refType === "menu" ? flat.menus.find((x) => x.id === it.refId)
          : it.refType === "subMenu" ? flat.subMenus.find((x) => x.id === it.refId)
          : flat.options.find((x) => x.id === it.refId));
      const moveItem = (i: number, dir: -1 | 1) => {
        const j = i + dir;
        if (j < 0 || j >= items.length) return;
        const next = [...items];
        [next[i], next[j]] = [next[j], next[i]];
        setItems(next);
      };
      const f = mmFilter[b.id] || {};
      const cat = (master || []).find((c: any) => c.id === f.cat);
      const menu = (cat?.menus || []).find((m: any) => m.id === f.menu);
      // 選択中分類の配下の「中分類本体・小分類・オプション」をまとめてリスト化
      const leaves: { kind: string; id: string; label: string; price: number }[] = [];
      if (menu) {
        leaves.push({ kind: "menu", id: menu.id, label: `${menu.title}（中分類そのもの）`, price: menu.basePrice });
        for (const o of menu.options || []) leaves.push({ kind: "option", id: o.id, label: `${o.title}（オプション）`, price: o.price });
        for (const s of menu.subMenus || []) {
          leaves.push({ kind: "subMenu", id: s.id, label: `${s.title}（小分類）`, price: s.price });
          for (const o of s.options || []) leaves.push({ kind: "option", id: o.id, label: `${s.title} > ${o.title}`, price: o.price });
        }
      }
      const isAdded = (kind: string, id: string) => items.some((x) => x.refType === kind && x.refId === id);
      const buttons = d.buttons || {};
      const setButton = (k: string, patch: { show?: boolean; label?: string }) =>
        updateData(idx, { buttons: { ...buttons, [k]: { ...(buttons[k] || {}), ...patch } } });
      const hasLeadBlock = blocks.some((x) => x.type === "leadForm" && x.visible !== false);
      const hasBookingBlock = blocks.some((x) => x.type === "bookingForm" && x.visible !== false);
      return (
        <>
          <input className={inputCls} placeholder="見出し（任意・ブロックの上に表示）" value={d.heading || ""} onChange={(e) => updateData(idx, { heading: e.target.value })} />

          <p className="text-xs font-bold text-gray-600 mt-2">メニューの前の文章（任意）</p>
          <div className="border rounded-lg">
            <RichTextEditor key={b.id + "-intro"} value={d.introHtml || ""} onChange={(html) => updateData(idx, { introHtml: html })} />
          </div>

          <p className="text-xs font-bold text-gray-600 mt-2">表示するメニュー（複数選べます・↑↓で並び替え）</p>
          {items.length > 0 ? (
            <ul className="space-y-1">
              {items.map((it, i) => {
                const l = labelOf(it);
                return (
                  <li key={`${it.refType}:${it.refId}`} className="flex items-center gap-2 text-xs bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
                    <span className="flex-1 min-w-0">
                      {l ? <><b>{l.label}</b>（¥{(l.price || 0).toLocaleString()}）</> : <span className="text-red-600">予約マスターに見つかりません（削除された項目）</span>}
                    </span>
                    <button type="button" onClick={() => moveItem(i, -1)} className="w-6 h-6 rounded bg-white border hover:bg-gray-100">↑</button>
                    <button type="button" onClick={() => moveItem(i, 1)} className="w-6 h-6 rounded bg-white border hover:bg-gray-100">↓</button>
                    <button type="button" onClick={() => setItems(items.filter((_, k) => k !== i))} className="text-red-500 font-bold hover:underline">外す</button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">まだメニューが選ばれていません。下で選んで「追加」してください。</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <select className="p-2 border rounded-lg text-sm" value={f.cat || ""} onChange={(e) => setMmFilter((prev) => ({ ...prev, [b.id]: { cat: e.target.value, menu: "" } }))}>
              <option value="">① 大分類を選択</option>
              {(master || []).map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <select className="p-2 border rounded-lg text-sm disabled:bg-slate-100" disabled={!f.cat} value={f.menu || ""} onChange={(e) => setMmFilter((prev) => ({ ...prev, [b.id]: { ...prev[b.id], menu: e.target.value } }))}>
              <option value="">② 中分類を選択</option>
              {(cat?.menus || []).map((m: any) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          {menu && (
            <div className="border rounded-lg divide-y max-h-64 overflow-auto">
              {leaves.map((l) => {
                const added = isAdded(l.kind, l.id);
                return (
                  <div key={`${l.kind}:${l.id}`} className="flex items-center gap-2 px-2 py-1.5 text-xs">
                    <span className="flex-1 min-w-0">{l.label}（¥{(l.price || 0).toLocaleString()}）</span>
                    {added ? (
                      <span className="text-emerald-700 font-bold">追加済み</span>
                    ) : (
                      <button type="button" onClick={() => setItems([...items, { refType: l.kind, refId: l.id }])} className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold hover:bg-blue-700">＋ 追加</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={d.showDesc !== false} onChange={(e) => updateData(idx, { showDesc: e.target.checked })} />おすすめ・作業内容・注意事項も表示する（作業内容・注意事項は ▼ で折りたたみ）</label>

          <p className="text-xs font-bold text-gray-600 mt-2">メニューの後の文章（任意）</p>
          <div className="border rounded-lg">
            <RichTextEditor key={b.id + "-outro"} value={d.outroHtml || ""} onChange={(html) => updateData(idx, { outroHtml: html })} />
          </div>

          <div className="mt-2 p-3 bg-slate-50 rounded-lg border space-y-2">
            <p className="text-xs font-bold text-slate-600">ブロック最下段のボタン（チェックで表示・文言は空欄なら既定の文言）</p>
            {MENU_BUTTON_KEYS.map((k) => {
              const missing = (k === "lead" && !hasLeadBlock) || (k === "booking" && !hasBookingBlock);
              return (
                <div key={k} className="flex items-center gap-2 flex-wrap">
                  <label className="text-xs flex items-center gap-1 w-36 shrink-0">
                    <input type="checkbox" checked={!!buttons[k]?.show} onChange={(e) => setButton(k, { show: e.target.checked })} />
                    {MENU_BUTTON_NAMES[k]}
                  </label>
                  <input
                    className="flex-1 min-w-[12rem] p-1.5 border rounded text-sm disabled:bg-slate-100"
                    disabled={!buttons[k]?.show}
                    placeholder={MENU_BUTTON_DEFAULTS[k]}
                    value={buttons[k]?.label || ""}
                    onChange={(e) => setButton(k, { label: e.target.value })}
                  />
                  {buttons[k]?.show && missing && (
                    <span className="basis-full text-[11px] text-amber-700">※このLPに{k === "lead" ? "「申込フォーム(軽量)」" : "「カレンダー予約フォーム」"}ブロックが無いため、公開ページではこのボタンは表示されません。</span>
                  )}
                </div>
              );
            })}
            <p className="text-[11px] text-gray-400">※電話ボタンは広告経由のときの転送番号に自動で置き換わります。LINEは共通のLINE URLです。</p>
          </div>
          <p className="text-[11px] text-gray-400">※価格・名称は予約マスターの最新値で表示されます（WEB特価・値引きがあれば反映）。</p>
        </>
      );
    }
    if (b.type === "html") {
      return (
        <>
          <p className="text-[11px] text-gray-500">HTMLをそのまま埋め込みます（&lt;style&gt;可）。BlockNoteで出せない表現やLP用の作り込みパーツに。</p>
          <textarea
            className="w-full p-2 border rounded-lg text-xs font-mono bg-slate-50"
            rows={10}
            spellCheck={false}
            placeholder="<style>...</style> と HTML を貼り付け"
            value={d.html || ""}
            onChange={(e) => updateData(idx, { html: e.target.value })}
          />
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={d.fullWidth === true} onChange={(e) => updateData(idx, { fullWidth: e.target.checked })} />全幅で表示する（左右の余白なし）</label>
        </>
      );
    }
    if (b.type === "cta") {
      return (
        <>
          <input className={inputCls} placeholder="ボタン文言" value={d.label || ""} onChange={(e) => updateData(idx, { label: e.target.value })} />
          <div className="flex gap-2">
            <select className="p-2 border rounded-lg text-sm" value={d.targetType || "form"} onChange={(e) => updateData(idx, { targetType: e.target.value })}>
              <option value="form">このページの申込フォームへ</option>
              <option value="hp">HP（トップ / 指定URL）へ</option>
              <option value="lp">別のLPへ</option>
            </select>
            {d.targetType === "hp" && <input className={inputCls} placeholder="空欄=HPトップ / 例: /service/bath" value={d.targetValue || ""} onChange={(e) => updateData(idx, { targetValue: e.target.value })} />}
            {d.targetType === "lp" && <input className={inputCls} placeholder="LPのslug（例: mizumawari-bathroom）" value={d.targetValue || ""} onChange={(e) => updateData(idx, { targetValue: e.target.value })} />}
          </div>
        </>
      );
    }
    if (b.type === "leadForm") {
      return (
        <>
          <input className={inputCls} placeholder="見出し" value={d.heading || ""} onChange={(e) => updateData(idx, { heading: e.target.value })} />
          <input className={inputCls} placeholder="補足文" value={d.note || ""} onChange={(e) => updateData(idx, { note: e.target.value })} />
          <p className="text-[11px] text-gray-400">※軽量リードフォーム（お名前・連絡先・写真添付など）を表示します。</p>
        </>
      );
    }
    if (b.type === "bookingForm") {
      // 大分類は複数選べる（refIds）。旧データ（refIdのみ）も読めるようにする。
      const rawIds: string[] = Array.isArray(b.refs?.refIds) && b.refs.refIds.length
        ? b.refs.refIds
        : (b.refs?.refId ? [b.refs.refId] : []);
      const catOrderCustom = !!b.refs?.catOrderCustom;
      const menuOrder: string[] = Array.isArray(b.refs?.menuOrder) ? b.refs.menuOrder : [];
      // 予約マスターのカレンダー表示順（calendarOrder → order）
      const calOrd = (x: any) => (x.calendarOrder ?? x.order ?? 0);
      const byCal = <T,>(arr: T[]) => [...arr].sort((a: any, z: any) => calOrd(a) - calOrd(z));
      const catById = new Map<string, any>((master || []).map((c: any) => [c.id, c]));
      // 画面に出す並び＝公開ページと同じ並び
      const selectedCats: any[] = (catOrderCustom
        ? rawIds.map((id) => catById.get(id))
        : byCal(rawIds.map((id) => catById.get(id)).filter(Boolean))
      ).filter(Boolean);
      const orderedMenus = (c: any): any[] => {
        const base = byCal(c.menus || []);
        if (!menuOrder.length) return base;
        const rank = new Map(menuOrder.map((id, i) => [id, i]));
        return base
          .map((m: any, i: number) => ({ m, i }))
          .sort((a, z) => (rank.has(a.m.id) ? rank.get(a.m.id)! : menuOrder.length + a.i) - (rank.has(z.m.id) ? rank.get(z.m.id)! : menuOrder.length + z.i))
          .map(({ m }) => m);
      };
      const toggleCat = (id: string) => {
        const cur = selectedCats.map((c) => c.id);
        const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
        updateRefs(idx, { refType: "category", refIds: next, refId: next[0] || "" });
      };
      const moveCat = (i: number, dir: -1 | 1) => {
        const ids = selectedCats.map((c) => c.id);
        const j = i + dir;
        if (j < 0 || j >= ids.length) return;
        [ids[i], ids[j]] = [ids[j], ids[i]];
        updateRefs(idx, { refType: "category", refIds: ids, refId: ids[0] || "", catOrderCustom: true });
      };
      const moveMenu = (c: any, i: number, dir: -1 | 1) => {
        const list = orderedMenus(c).map((m: any) => m.id);
        const j = i + dir;
        if (j < 0 || j >= list.length) return;
        [list[i], list[j]] = [list[j], list[i]];
        // この大分類の中分類の並びを、menuOrder（全大分類分）の中で置き換える
        const others = menuOrder.filter((id) => !(c.menus || []).some((m: any) => m.id === id));
        updateRefs(idx, { menuOrder: [...others, ...list] });
      };
      const resetOrder = () => updateRefs(idx, { catOrderCustom: false, menuOrder: [] });
      return (
        <>
          <input className={inputCls} placeholder="見出し" value={d.heading || ""} onChange={(e) => updateData(idx, { heading: e.target.value })} />
          <p className="text-xs font-bold text-gray-600 mt-1">予約カテゴリ（大分類）を選択 ※複数選択できます</p>
          <div className="grid grid-cols-2 gap-1.5">
            {flat.categories.map((c) => {
              const on = selectedCats.some((x) => x.id === c.id);
              return (
                <label key={c.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-sm cursor-pointer ${on ? "bg-blue-50 border-blue-300 font-bold" : "bg-white border-gray-200"}`}>
                  <input type="checkbox" checked={on} onChange={() => toggleCat(c.id)} />
                  {c.title}
                </label>
              );
            })}
          </div>

          {selectedCats.length > 0 && (
            <div className="mt-2 p-3 bg-slate-50 rounded-lg border space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs font-bold text-slate-600">このLPのカレンダーでの表示順（↑↓で並び替え・このLPだけに反映）</p>
                {(catOrderCustom || menuOrder.length > 0) && (
                  <button type="button" onClick={resetOrder} className="text-[11px] font-bold text-slate-500 hover:underline">予約マスターの順に戻す</button>
                )}
              </div>
              <ol className="space-y-2">
                {selectedCats.map((c, i) => (
                  <li key={c.id} className="bg-white border rounded-lg">
                    <div className="flex items-center gap-2 px-2 py-1.5 border-b bg-blue-50/50 rounded-t-lg">
                      <span className="flex-1 text-sm font-bold">📂 {c.title}</span>
                      <button type="button" onClick={() => moveCat(i, -1)} className="w-6 h-6 rounded bg-white border text-xs hover:bg-gray-100">↑</button>
                      <button type="button" onClick={() => moveCat(i, 1)} className="w-6 h-6 rounded bg-white border text-xs hover:bg-gray-100">↓</button>
                    </div>
                    <ul className="divide-y">
                      {orderedMenus(c).map((m: any, mi: number) => (
                        <li key={m.id} className="flex items-center gap-2 px-3 py-1 text-xs">
                          <span className={`flex-1 min-w-0 ${m.showOnCalendar === false ? "text-gray-400" : ""}`}>
                            {m.title}
                            {m.showOnCalendar === false && <span className="ml-1 text-[10px] font-bold text-gray-500">（カレンダー非表示のため出ません）</span>}
                          </span>
                          <button type="button" onClick={() => moveMenu(c, mi, -1)} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200">↑</button>
                          <button type="button" onClick={() => moveMenu(c, mi, 1)} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200">↓</button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
              <p className="text-[11px] text-gray-400">※並び替えていない間は、予約マスターのカレンダー表示順で表示されます。予約マスターに後から追加した中分類は、その大分類の最後に表示されます。</p>
            </div>
          )}
          <p className="text-[11px] text-gray-400">※選んだ大分類のメニューで、カレンダー付きの予約・見積フォームを表示します（価格は予約マスター連動）。複数選ぶと、お客様は大分類ごとにチェックして中のメニューを開く形になります。</p>
        </>
      );
    }
    if (b.type === "pains") {
      const items: string[] = Array.isArray(d.items) ? d.items : [];
      return (
        <>
          <input className={inputCls} placeholder="見出し（空欄で見出しなし）" value={d.heading ?? ""} onChange={(e) => updateData(idx, { heading: e.target.value })} />
          <p className="text-xs font-bold text-gray-600">お悩み（1行に1つ）</p>
          <textarea
            className="w-full p-2 border rounded-lg text-sm"
            rows={6}
            placeholder={"お風呂のカビが落ちない\n換気扇の油汚れが取れない"}
            value={items.join("\n")}
            onChange={(e) => updateData(idx, { items: e.target.value.split("\n") })}
            onBlur={(e) => updateData(idx, { items: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })}
          />
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={d.showCta !== false} onChange={(e) => updateData(idx, { showCta: e.target.checked })} />下に「LINEで写真を送る／無料相談・予約」の枠を出す</label>
          {d.showCta !== false && (
            <textarea className="w-full p-2 border rounded-lg text-sm" rows={2} placeholder={"枠の見出し（空欄なら「その汚れ、写真を送るだけで／料金がわかります」）"} value={d.ctaTitle || ""} onChange={(e) => updateData(idx, { ctaTitle: e.target.value })} />
          )}
        </>
      );
    }
    if (b.type === "recommended") {
      return (
        <>
          <input className={inputCls} placeholder="見出し" value={d.heading ?? ""} onChange={(e) => updateData(idx, { heading: e.target.value })} />
          <input className={inputCls} placeholder="見出しの下の一言（任意）" value={d.sub ?? ""} onChange={(e) => updateData(idx, { sub: e.target.value })} />
          <RowsEditor
            rows={d.items}
            onChange={(items) => updateData(idx, { items })}
            fields={[
              { key: "badge", label: "バッジ（例：人気No.1）" },
              { key: "name", label: "メニュー名" },
              { key: "note", label: "補足（任意）" },
              { key: "price", label: "価格の表記（例：¥26,460〜）" },
            ]}
            addLabel="メニューを追加"
          />
          <p className="text-[11px] text-gray-400">※カードの「これで相談する」ボタンは、このLPの申込フォーム（無ければカレンダー予約）へ飛びます。価格を予約マスターと連動させたい場合は「メニュー(予約マスター連動)」ブロックを使ってください。</p>
        </>
      );
    }
    if (b.type === "reasons") {
      return (
        <>
          <input className={inputCls} placeholder="見出し" value={d.heading ?? ""} onChange={(e) => updateData(idx, { heading: e.target.value })} />
          <RowsEditor
            rows={d.items}
            onChange={(items) => updateData(idx, { items })}
            fields={[{ key: "title", label: "理由のタイトル" }, { key: "body", label: "説明", multiline: true }]}
            addLabel="理由を追加"
          />
        </>
      );
    }
    if (b.type === "steps") {
      return (
        <>
          <input className={inputCls} placeholder="見出し" value={d.heading ?? ""} onChange={(e) => updateData(idx, { heading: e.target.value })} />
          <RowsEditor
            rows={d.items}
            onChange={(items) => updateData(idx, { items })}
            fields={[{ key: "t", label: "ステップ名（例：お問い合わせ）" }, { key: "d", label: "説明", multiline: true }]}
            addLabel="ステップを追加"
          />
          <p className="text-[11px] text-gray-400">※1つも入力しない場合は、リッチLPと同じ共通の「ご利用の流れ」を表示します。</p>
        </>
      );
    }
    if (b.type === "voices" || b.type === "faq") {
      const isVoice = b.type === "voices";
      const pageIds: string[] = Array.isArray(d.servicePageIds) ? d.servicePageIds : [];
      return (
        <>
          <input className={inputCls} placeholder="見出し" value={d.heading ?? ""} onChange={(e) => updateData(idx, { heading: e.target.value })} />
          <p className="text-xs font-bold text-gray-600 mt-1">{isVoice ? "口コミ" : "FAQ"}を連動するサービス詳細ページ（複数可・上から順に表示）</p>
          <IdPicker
            ids={pageIds}
            options={servicePages.map((sp) => ({ id: sp.id, label: sp.title }))}
            onChange={(ids) => updateData(idx, { servicePageIds: ids })}
            placeholder="サービス詳細ページを選択"
          />
          <p className="text-xs font-bold text-gray-600 mt-2">手入力の{isVoice ? "口コミ" : "質問"}（連動分の後に表示）</p>
          {isVoice ? (
            <RowsEditor
              rows={d.items}
              onChange={(items) => updateData(idx, { items })}
              fields={[{ key: "text", label: "口コミ本文", multiline: true }, { key: "who", label: "お名前・属性（例：札幌市北区 40代女性）" }, { key: "stars", label: "星の数（1〜5）", type: "number" }]}
              addLabel="口コミを追加"
            />
          ) : (
            <RowsEditor
              rows={d.items}
              onChange={(items) => updateData(idx, { items })}
              fields={[{ key: "q", label: "質問" }, { key: "a", label: "回答", multiline: true }]}
              addLabel="質問を追加"
            />
          )}
          {isVoice && (
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={d.showRating !== false} onChange={(e) => updateData(idx, { showRating: e.target.checked })} />見出しの下に評価（★4.9 など共通設定）を出す</label>
              <label className="text-xs flex items-center gap-1">表示する最大件数
                <input type="number" min={0} className="w-16 p-1 border rounded text-sm" value={d.limit || ""} placeholder="全件" onChange={(e) => updateData(idx, { limit: Number(e.target.value) || 0 })} />
              </label>
            </div>
          )}
          <p className="text-[11px] text-gray-400">※連動分は、サービス詳細ページの編集画面の{isVoice ? "お客様の声（公開中のもの）" : "FAQ"}がそのまま出ます（あちらを直せばここも変わります）。</p>
        </>
      );
    }
    if (b.type === "beforeAfter") {
      const ids: string[] = Array.isArray(d.ids) ? d.ids : [];
      return (
        <>
          <input className={inputCls} placeholder="見出し" value={d.heading ?? ""} onChange={(e) => updateData(idx, { heading: e.target.value })} />
          <p className="text-xs font-bold text-gray-600 mt-1">表示する施工事例（/admin/before-after で登録したものから選択・上から順に表示）</p>
          <IdPicker
            ids={ids}
            options={beforeAfters.map((x) => ({ id: x.id, label: x.title }))}
            onChange={(next) => updateData(idx, { ids: next })}
            placeholder="施工事例を選択"
          />
          <p className="text-[11px] text-gray-400">※単体ページ（URL）がある事例には「詳しく見る →」のリンクが付きます。</p>
        </>
      );
    }
    if (b.type === "assurance") {
      return (
        <>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={d.showAssurance !== false} onChange={(e) => updateData(idx, { showAssurance: e.target.checked })} />安心の理由を表示</label>
          {d.showAssurance !== false && <input className={inputCls} placeholder="見出し（例：安心の理由）" value={d.assuranceHeading ?? ""} onChange={(e) => updateData(idx, { assuranceHeading: e.target.value })} />}
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={d.showArea !== false} onChange={(e) => updateData(idx, { showArea: e.target.checked })} />対応エリアを表示</label>
          {d.showArea !== false && <input className={inputCls} placeholder="見出し（例：対応エリア）" value={d.areaHeading ?? ""} onChange={(e) => updateData(idx, { areaHeading: e.target.value })} />}
          <p className="text-[11px] text-gray-400">※内容はリッチLPと同じ共通の文章です（サイト全体の共通設定）。</p>
        </>
      );
    }
    if (b.type === "seasonal") {
      const em = editMonths[b.id] || (new Date().getMonth() + 1);
      const entries = (b.data && b.data.entries) || {};
      const e = entries[String(em)] || {};
      const filledMonths = Object.keys(entries).filter((k) => { const x = entries[k]; return x && (x.heading || x.body || x.badge); }).map(Number);
      return (
        <>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-600">編集する月</label>
            <select className="p-2 border rounded-lg text-sm" value={em} onChange={(ev) => setEditMonths((pp) => ({ ...pp, [b.id]: Number(ev.target.value) }))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}月{filledMonths.includes(m) ? " ●" : ""}</option>)}
            </select>
          </div>
          <input className={inputCls} placeholder="バッジ（例：梅雨のカビ対策）" value={e.badge || ""} onChange={(ev) => updateEntry(idx, em, { badge: ev.target.value })} />
          <input className={inputCls} placeholder="見出し" value={e.heading || ""} onChange={(ev) => updateEntry(idx, em, { heading: ev.target.value })} />
          <div className="border rounded-lg">
            <RichTextEditor key={b.id + "-" + em} value={e.body || ""} onChange={(html) => updateEntry(idx, em, { body: html })} />
          </div>
          <p className="text-[11px] text-gray-400">●=入力済みの月。入力した月がその月に自動表示され、未入力の月は直近で入力済みの月の内容が出ます。</p>
        </>
      );
    }
    return null;
  }
}

type RowField = { key: string; label: string; multiline?: boolean; type?: "number" };

/** 繰り返し入力（理由・ステップ・口コミ・FAQ など）。↑↓で並び替え・削除 */
function RowsEditor({ rows, fields, onChange, addLabel }: { rows: unknown; fields: RowField[]; onChange: (rows: any[]) => void; addLabel: string }) {
  const list: any[] = Array.isArray(rows) ? rows : [];
  const set = (i: number, key: string, value: any) => onChange(list.map((r, k) => (k === i ? { ...r, [key]: value } : r)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {list.map((r, i) => (
        <div key={i} className="border rounded-lg p-2 bg-slate-50 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">{i + 1}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} className="w-6 h-6 rounded bg-white border text-xs hover:bg-gray-100">↑</button>
              <button type="button" onClick={() => move(i, 1)} className="w-6 h-6 rounded bg-white border text-xs hover:bg-gray-100">↓</button>
              <button type="button" onClick={() => onChange(list.filter((_, k) => k !== i))} className="ml-1 text-red-500 text-xs font-bold hover:underline">削除</button>
            </div>
          </div>
          {fields.map((f) =>
            f.multiline ? (
              <textarea key={f.key} rows={3} className="w-full p-2 border rounded text-sm bg-white" placeholder={f.label} value={r?.[f.key] ?? ""} onChange={(e) => set(i, f.key, e.target.value)} />
            ) : (
              <input
                key={f.key}
                type={f.type === "number" ? "number" : "text"}
                className="w-full p-2 border rounded text-sm bg-white"
                placeholder={f.label}
                value={r?.[f.key] ?? ""}
                onChange={(e) => set(i, f.key, f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
              />
            )
          )}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, {}])} className="text-xs font-bold px-3 py-1.5 rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100">＋ {addLabel}</button>
    </div>
  );
}

/** 一覧から選んで追加する（連動するサービス詳細ページ・施工事例）。↑↓で並び替え */
function IdPicker({ ids, options, onChange, placeholder }: { ids: string[]; options: { id: string; label: string }[]; onChange: (ids: string[]) => void; placeholder: string }) {
  const [toAdd, setToAdd] = useState("");
  const labelOf = (id: string) => options.find((o) => o.id === id)?.label;
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    const next = [...ids];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-1.5">
      {ids.length > 0 && (
        <ul className="space-y-1">
          {ids.map((id, i) => (
            <li key={id} className="flex items-center gap-2 text-xs bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
              <span className="flex-1 min-w-0">{labelOf(id) ?? (options.length ? <span className="text-red-600">見つかりません（削除された可能性）</span> : "読み込み中...")}</span>
              <button type="button" onClick={() => move(i, -1)} className="w-6 h-6 rounded bg-white border hover:bg-gray-100">↑</button>
              <button type="button" onClick={() => move(i, 1)} className="w-6 h-6 rounded bg-white border hover:bg-gray-100">↓</button>
              <button type="button" onClick={() => onChange(ids.filter((x) => x !== id))} className="text-red-500 font-bold hover:underline">外す</button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <select value={toAdd} onChange={(e) => setToAdd(e.target.value)} className="flex-1 min-w-0 p-2 border rounded-lg text-sm">
          <option value="">{placeholder}</option>
          {options.filter((o) => !ids.includes(o.id)).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <button type="button" onClick={() => { if (toAdd) { onChange([...ids, toAdd]); setToAdd(""); } }} className="shrink-0 bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-blue-700">＋ 追加</button>
      </div>
    </div>
  );
}

function ImageField({ url, onPick }: { url?: string; onPick: (f: File) => void }) {
  return (
    <div className="flex items-center gap-3">
      {url ? <img src={url} alt="" className="w-20 h-20 object-cover rounded border" /> : <div className="w-20 h-20 rounded border bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">画像なし</div>}
      <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }} className="text-xs" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <BlocksBuilder />
    </Suspense>
  );
}
