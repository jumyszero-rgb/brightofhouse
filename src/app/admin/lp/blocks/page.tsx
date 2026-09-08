// @/src/app/admin/lp/blocks/page.tsx
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import RichTextEditor from "@/components/RichTextEditor";

type Block = { id: string; type: string; visible?: boolean; data: any; refs?: any };

const BLOCK_TYPES: { type: string; label: string }[] = [
  { type: "hero", label: "ヒーロー" },
  { type: "richText", label: "見出し＋本文" },
  { type: "image", label: "画像" },
  { type: "seasonal", label: "季節のおすすめ(月替り)" },
  { type: "masterMenu", label: "メニュー(予約マスター連動)" },
  { type: "cta", label: "CTAボタン" },
  { type: "leadForm", label: "申込フォーム(軽量)" },
  { type: "bookingForm", label: "カレンダー予約フォーム" },
];

function newBlock(type: string): Block {
  const id = crypto.randomUUID();
  switch (type) {
    case "hero": return { id, type, visible: true, data: { eyebrow: "", title: "", subtitle: "", priceLead: "", imageUrl: "" } };
    case "richText": return { id, type, visible: true, data: { heading: "", body: "" } };
    case "image": return { id, type, visible: true, data: { imageUrl: "", caption: "" } };
    case "seasonal": return { id, type, visible: true, data: { entries: {} } };
    case "masterMenu": return { id, type, visible: true, data: { showDesc: true }, refs: { refType: "menu", refId: "" } };
    case "cta": return { id, type, visible: true, data: { label: "お問い合わせはこちら", targetType: "form", targetValue: "" } };
    case "leadForm": return { id, type, visible: true, data: { heading: "無料相談・お見積り", note: "30秒で送信できます" } };
    case "bookingForm": return { id, type, visible: true, data: { heading: "ご希望日時から仮予約・お見積り" }, refs: { refType: "category", refId: "" } };
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

  // 新規作成用
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");

  useEffect(() => {
    fetch("/api/booking-master").then((r) => r.ok ? r.json() : []).then(setMaster).catch(() => {});
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
            <h1 className="text-lg font-bold">ブロック編集：{meta?.title}</h1>
            <p className="text-xs text-gray-500">/lp/{meta?.slug}　状態：{meta?.status === "PUBLISHED" ? "公開中" : "下書き"}</p>
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
                <span className="text-sm font-bold text-slate-700">{BLOCK_TYPES.find((t) => t.type === b.type)?.label || b.type}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => move(idx, -1)} className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 text-sm">↑</button>
                  <button onClick={() => move(idx, 1)} className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 text-sm">↓</button>
                  <label className="text-xs flex items-center gap-1 ml-2">
                    <input type="checkbox" checked={b.visible !== false} onChange={(e) => update(idx, { visible: e.target.checked })} />表示
                  </label>
                  <button onClick={() => remove(idx)} className="ml-2 text-red-500 text-xs font-bold hover:underline">削除</button>
                </div>
              </div>
              <div className="p-4 space-y-2">{renderEditor(b, idx)}</div>
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

  function renderEditor(b: Block, idx: number) {
    const d = b.data || {};
    const inputCls = "w-full p-2 border rounded-lg text-sm";
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
      const refType = b.refs?.refType || "menu";
      const list = refType === "menu" ? flat.menus : refType === "subMenu" ? flat.subMenus : flat.options;
      return (
        <>
          <div className="flex gap-2">
            <select className="p-2 border rounded-lg text-sm" value={refType} onChange={(e) => updateRefs(idx, { refType: e.target.value, refId: "" })}>
              <option value="menu">中分類</option>
              <option value="subMenu">小分類</option>
              <option value="option">オプション</option>
            </select>
            <select className="flex-1 p-2 border rounded-lg text-sm" value={b.refs?.refId || ""} onChange={(e) => updateRefs(idx, { refId: e.target.value })}>
              <option value="">— 項目を選択 —</option>
              {list.map((it) => <option key={it.id} value={it.id}>{it.label}（¥{it.price?.toLocaleString?.() ?? it.price}）</option>)}
            </select>
          </div>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={d.showDesc !== false} onChange={(e) => updateData(idx, { showDesc: e.target.checked })} />作業内容の説明も表示する</label>
          <p className="text-[11px] text-gray-400">※価格・名称は予約マスターの最新値で表示されます（ここでは保存しません）。</p>
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
      return (
        <>
          <input className={inputCls} placeholder="見出し" value={d.heading || ""} onChange={(e) => updateData(idx, { heading: e.target.value })} />
          <select className={inputCls} value={b.refs?.refId || ""} onChange={(e) => updateRefs(idx, { refType: "category", refId: e.target.value })}>
            <option value="">— 予約カテゴリ(大分類)を選択 —</option>
            {flat.categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <p className="text-[11px] text-gray-400">※選んだ大分類のメニューで、カレンダー付きの予約・見積フォームを表示します（価格は予約マスター連動）。</p>
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
