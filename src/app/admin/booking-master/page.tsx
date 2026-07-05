// @/src/app/admin/booking-master/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { roundAmount, type RoundingMode } from "@/lib/bookingMenuToBookingData";

// --- 型定義 ---
type DiscountRule = { count: number; value: number };
type SetDiscountRules = { enabled: boolean; type: "amount" | "percent"; rules: DiscountRule[]; rounding?: RoundingMode } | null;
const ON_SITE_ESTIMATE_LABEL: Record<string, string> = { NONE: "見積不要", POSSIBLE: "現地見積可", REQUIRED: "現地見積必須" };
const ROUNDING_LABEL: Record<string, string> = { NONE: "端数処理なし", UP: "100円単位で切り上げ", DOWN: "100円単位で切り捨て" };

// 割引率表示のラベル。端数処理(切り上げ/切り捨て)が有効な場合、実際の値引率とズレるため「約」を付ける。
const discountLabel = (value: number, rounding?: string) => `${rounding && rounding !== "NONE" ? "約" : ""}${value}%`;

// 端数処理(切り上げ/切り捨て)の選択。セット割引・個数値引きのルール全体に1つ適用する。
function RoundingSelect({ value, onChange }: { value: RoundingMode | undefined; onChange: (v: RoundingMode) => void }) {
  return (
    <select value={value || "NONE"} onChange={(e) => onChange(e.target.value as RoundingMode)} className="p-1 border rounded text-[10px]">
      {Object.entries(ROUNDING_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
    </select>
  );
}

type QtyDiscountRules = { enabled: boolean; rules: DiscountRule[]; rounding?: RoundingMode } | null;
function newQtyDiscountRules(): NonNullable<QtyDiscountRules> {
  return { enabled: false, rules: [], rounding: "NONE" };
}

// 個数値引きルールの簡易エディタ（個数上限のある追加オプション用）
function QtyDiscountEditor({ value, onChange }: { value: QtyDiscountRules; onChange: (v: QtyDiscountRules) => void }) {
  const v = value || newQtyDiscountRules();
  const updateRule = (idx: number, patch: Partial<DiscountRule>) => {
    onChange({ ...v, rules: v.rules.map((r, i) => i === idx ? { ...r, ...patch } : r) });
  };
  const removeRule = (idx: number) => {
    onChange({ ...v, rules: v.rules.filter((_, i) => i !== idx) });
  };
  return (
    <div className="bg-red-50 p-2 rounded-lg border border-red-200 space-y-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={v.enabled} onChange={() => onChange({ ...v, enabled: !v.enabled })} className="w-3.5 h-3.5 accent-red-600" />
        <span className="text-[10px] font-bold text-red-800">個数値引きを有効にする（例: 3個以上で10%引き）</span>
      </label>
      {v.enabled && (
        <div className="space-y-1 pl-2">
          {v.rules.map((rule, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <input type="number" min={1} value={rule.count || ""} onChange={(e) => updateRule(idx, { count: parseInt(e.target.value) || 1 })} className="w-14 p-1 border rounded text-[10px]" placeholder="個数" />
              <span className="text-[10px] font-bold text-red-700">個以上で</span>
              <input type="number" min={0} max={99} step={0.1} value={rule.value || ""} onChange={(e) => updateRule(idx, { value: parseFloat(e.target.value) || 0 })} className="w-16 p-1 border rounded text-[10px]" placeholder="%" />
              <span className="text-[10px] text-red-600">{discountLabel(rule.value, v.rounding)}引き</span>
              <button type="button" onClick={() => removeRule(idx)} className="text-red-500 text-[9px] font-bold hover:underline">削除</button>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-red-700">端数処理:</span>
            <RoundingSelect value={v.rounding} onChange={(rounding) => onChange({ ...v, rounding })} />
          </div>
          <button
            type="button"
            onClick={() => {
              const nextCount = v.rules.length > 0 ? Math.max(...v.rules.map(r => r.count)) + 1 : 2;
              onChange({ ...v, rules: [...v.rules, { count: nextCount, value: 0 }] });
            }}
            className="text-[9px] bg-red-600 text-white px-2 py-1 rounded-full font-bold hover:bg-red-700"
          >
            ＋ 段階を追加
          </button>
        </div>
      )}
    </div>
  );
}

type BookingOption = { id: string; title: string; price: number; durationMin: number; durationMax: number | null; workContent: string | null; cautionNote: string | null; recommendPoint: string | null; onSiteEstimate: string; maxQty: number | null; discountPercent: number | null; discountRounding: string; qtyDiscountRules: QtyDiscountRules; order: number; subMenuId: string };
type BookingSubMenu = { id: string; title: string; price: number; durationMin: number; durationMax: number | null; workContent: string | null; cautionNote: string | null; recommendPoint: string | null; onSiteEstimate: string; discountPercent: number | null; discountRounding: string; order: number; menuId: string; options: BookingOption[] };
type BookingMenu = { id: string; title: string; basePrice: number; priceNote: string | null; workContent: string | null; cautionNote: string | null; recommendPoint: string | null; onSiteEstimate: string; durationMin: number; durationMax: number | null; setDiscountRules: SetDiscountRules; discountPercent: number | null; discountRounding: string; order: number; categoryId: string; subMenus: BookingSubMenu[] };
type BookingCategory = { id: string; title: string; order: number; setDiscountRules: SetDiscountRules; menus: BookingMenu[] };

function newSetDiscountRules(): NonNullable<SetDiscountRules> {
  return { enabled: false, type: "percent", rules: [], rounding: "NONE" };
}

// セット割引ルールの簡易エディタ（大分類・中分類で共用）
function SetDiscountEditor({ value, onChange }: { value: SetDiscountRules; onChange: (v: SetDiscountRules) => void }) {
  const v = value || newSetDiscountRules();
  return (
    <div className="bg-green-50 p-3 rounded-lg border border-green-200 space-y-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={v.enabled} onChange={() => onChange({ ...v, enabled: !v.enabled })} className="w-4 h-4 accent-green-600" />
        <span className="text-xs font-bold text-green-800">セット割引を有効にする（例: 2〜5点選択で5〜20%OFF）</span>
      </label>
      {v.enabled && (
        <div className="space-y-2 pl-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-green-700">方式:</span>
            <select value={v.type} onChange={(e) => onChange({ ...v, type: e.target.value as "amount" | "percent" })} className="p-1 border rounded text-xs">
              <option value="percent">%引き</option>
              <option value="amount">円引き</option>
            </select>
          </div>
          {v.rules.sort((a, b) => a.count - b.count).map((rule) => (
            <div key={rule.count} className="flex items-center gap-2">
              <span className="text-xs font-bold text-green-700 w-14">{rule.count}点で</span>
              <input type="number" step={v.type === "percent" ? 0.1 : 1} value={rule.value || ""} onChange={(e) => onChange({ ...v, rules: v.rules.map(r => r.count === rule.count ? { ...r, value: parseFloat(e.target.value) || 0 } : r) })} className="w-20 p-1 border rounded text-xs" />
              <span className="text-xs text-green-600">{v.type === "amount" ? "円引き" : `${discountLabel(rule.value, v.rounding)}引き`}</span>
              <button type="button" onClick={() => onChange({ ...v, rules: v.rules.filter(r => r.count !== rule.count) })} className="text-red-500 text-[10px] font-bold hover:underline">削除</button>
            </div>
          ))}
          {v.type === "percent" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-green-700">端数処理:</span>
              <RoundingSelect value={v.rounding} onChange={(rounding) => onChange({ ...v, rounding })} />
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              const nextCount = v.rules.length > 0 ? Math.min(10, Math.max(...v.rules.map(r => r.count)) + 1) : 2;
              if (nextCount > 10) return;
              onChange({ ...v, rules: [...v.rules, { count: nextCount, value: 0 }] });
            }}
            className="text-[10px] bg-green-600 text-white px-2 py-1 rounded-full font-bold hover:bg-green-700"
          >
            ＋ 段階を追加
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminBookingMasterPage() {
  const [categories, setCategories] = useState<BookingCategory[]>([]);
  const [loading, setLoading] = useState(false);

  // 新規追加用ステート
  const [newCatTitle, setNewCatTitle] = useState("");
  const [newMenu, setNewMenu] = useState({ categoryId: "", title: "", basePrice: 0, priceNote: "", workContent: "", cautionNote: "", recommendPoint: "", onSiteEstimate: "NONE", durationMin: 60, durationMax: 0, discountPercent: "", discountRounding: "NONE" });
  const [newSubMenu, setNewSubMenu] = useState({ menuId: "", title: "", price: 0, durationMin: 0, durationMax: 0, workContent: "", cautionNote: "", recommendPoint: "", onSiteEstimate: "NONE", discountPercent: "", discountRounding: "NONE" });
  const[newOption, setNewOption] = useState<{ subMenuId: string; title: string; price: number; durationMin: number; durationMax: number; workContent: string; cautionNote: string; recommendPoint: string; onSiteEstimate: string; maxQty: string; discountPercent: string; discountRounding: string; qtyDiscountRules: QtyDiscountRules }>({ subMenuId: "", title: "", price: 0, durationMin: 0, durationMax: 0, workContent: "", cautionNote: "", recommendPoint: "", onSiteEstimate: "NONE", maxQty: "", discountPercent: "", discountRounding: "NONE", qtyDiscountRules: null });

  // 編集用ステート
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  // 複製用ステート（既存の中分類・小分類・オプションを別の親の下にコピーし、値引き率などを独立して編集できるようにする）
  const [duplicating, setDuplicating] = useState<{ type: "menu" | "submenu" | "option"; source: any } | null>(null);
  const [duplicateTargetId, setDuplicateTargetId] = useState("");

  const startDuplicate = (source: any, type: "menu" | "submenu" | "option") => {
    setDuplicating({ type, source });
    setDuplicateTargetId(type === "menu" ? source.categoryId : type === "submenu" ? source.menuId : source.subMenuId);
  };

  const runDuplicate = async () => {
    if (!duplicating || !duplicateTargetId) return;
    const { type, source } = duplicating;
    const title = `${source.title} (コピー)`;
    if (type === "menu") {
      const targetCat = categories.find(c => c.id === duplicateTargetId);
      await handleAction("POST", {
        type: "menu", categoryId: duplicateTargetId, title,
        basePrice: source.basePrice, priceNote: source.priceNote, workContent: source.workContent,
        cautionNote: source.cautionNote, recommendPoint: source.recommendPoint, onSiteEstimate: source.onSiteEstimate,
        durationMin: source.durationMin, durationMax: source.durationMax, setDiscountRules: source.setDiscountRules ?? undefined,
        discountPercent: source.discountPercent, discountRounding: source.discountRounding,
        order: targetCat ? targetCat.menus.length : 0,
      });
    } else if (type === "submenu") {
      const allMenus = categories.flatMap(c => c.menus);
      const targetMenu = allMenus.find(m => m.id === duplicateTargetId);
      await handleAction("POST", {
        type: "submenu", menuId: duplicateTargetId, title,
        price: source.price, durationMin: source.durationMin, durationMax: source.durationMax,
        workContent: source.workContent, cautionNote: source.cautionNote, recommendPoint: source.recommendPoint,
        onSiteEstimate: source.onSiteEstimate, discountPercent: source.discountPercent, discountRounding: source.discountRounding,
        order: targetMenu ? targetMenu.subMenus.length : 0,
      });
    } else {
      const allSubMenus = categories.flatMap(c => c.menus.flatMap(m => m.subMenus));
      const targetSubMenu = allSubMenus.find(s => s.id === duplicateTargetId);
      await handleAction("POST", {
        type: "option", subMenuId: duplicateTargetId, title,
        price: source.price, durationMin: source.durationMin, durationMax: source.durationMax,
        onSiteEstimate: source.onSiteEstimate, maxQty: source.maxQty, discountPercent: source.discountPercent,
        discountRounding: source.discountRounding, qtyDiscountRules: source.qtyDiscountRules ?? undefined,
        order: targetSubMenu ? targetSubMenu.options.length : 0,
      });
    }
    setDuplicating(null);
    setDuplicateTargetId("");
  };

  const fetchData = async () => {
    const res = await fetch("/api/booking-master");
    if (res.ok) setCategories(await res.json());
  };

  useEffect(() => { fetchData(); },[]);

  // --- 汎用アクション処理 ---
  const handleAction = async (method: string, body: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/booking-master", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("API Error");
      await fetchData();
    } catch (e) {
      alert("処理に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // --- 並び替え処理 ---
  const handleMove = async (index: number, direction: "up" | "down", list: any[], type: string) => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === list.length - 1)) return;
    setLoading(true);
    const newList = [...list];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    try {
      await Promise.all(newList.map((item, idx) => {
        return fetch("/api/booking-master", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, type, order: idx }) });
      }));
      await fetchData();
    } catch (e) { alert("並び替えに失敗しました"); } finally { setLoading(false); }
  };

  const startEdit = (data: any, type: string) => { setEditingId(data.id); setEditData({ ...data, type }); };
  const saveEdit = async () => { await handleAction("PUT", editData); setEditingId(null); setEditData({}); };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black pb-40">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">予約システム専用 メニュー管理 (4階層)</h1>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">← ダッシュボードへ戻る</Link>
        </div>

        {loading && <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"><div className="bg-white p-4 rounded shadow font-bold">処理中...</div></div>}

        {/* --- 1. 大分類追加 --- */}
        <div className="bg-white p-4 rounded-lg shadow mb-8 flex gap-2">
          <input type="text" placeholder="大分類を追加 (例: 水回りクリーニング)" className="flex-1 p-2 border rounded text-black" value={newCatTitle} onChange={(e) => setNewCatTitle(e.target.value)} />
          <button onClick={() => { handleAction("POST", { type: "category", title: newCatTitle, order: categories.length }); setNewCatTitle(""); }} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">大分類追加</button>
        </div>

        <div className="space-y-12">
          {categories.map((cat, catIdx) => (
            <div key={cat.id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              
              {/* 【1階層目】大分類ヘッダー */}
              <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                {editingId === cat.id ? (
                  <div className="flex gap-2 flex-1">
                    <input className="flex-1 p-1 border rounded text-black" value={editData.title} onChange={(e) => setEditData((prev:any) => ({...prev, title: e.target.value}))} />
                    <button onClick={saveEdit} className="bg-green-600 text-white px-3 rounded text-sm font-bold">保存</button>
                    <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-3 rounded text-sm font-bold">中止</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    <button onClick={() => handleMove(catIdx, "up", categories, "category")} className="px-2 bg-white/10 rounded hover:bg-white/20">↑</button>
                    <button onClick={() => handleMove(catIdx, "down", categories, "category")} className="px-2 bg-white/10 rounded hover:bg-white/20">↓</button>
                    <h2 className="text-xl font-bold flex-1 ml-2">📂 大分類: {cat.title}</h2>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(cat, "category")} className="text-blue-300 text-sm hover:underline">編集</button>
                      <button onClick={() => handleAction("DELETE", { id: cat.id, type: "category" })} className="text-red-400 text-sm hover:underline">削除</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-8">

                {/* --- 大分類のセット割引設定 --- */}
                <SetDiscountEditor
                  value={cat.setDiscountRules}
                  onChange={(v) => handleAction("PUT", { id: cat.id, type: "category", title: cat.title, order: cat.order, setDiscountRules: v })}
                />

                {/* --- 中分類追加フォーム --- */}
                <div className="flex flex-col gap-2 bg-blue-50/50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-bold text-blue-800">新規中分類の追加</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    <div className="flex gap-2">
                      <input type="text" placeholder="中分類 (例: キッチンクリーニング)" className="flex-1 p-2 border rounded text-black text-sm" value={newMenu.categoryId === cat.id ? newMenu.title : ""} onChange={(e) => setNewMenu({ ...newMenu, categoryId: cat.id, title: e.target.value })} />
                    </div>
                    <div className="flex gap-2 items-center">
                      <input type="number" placeholder="基本料金(円)" className="w-32 p-2 border rounded text-black text-sm" value={newMenu.categoryId === cat.id ? newMenu.basePrice || "" : ""} onChange={(e) => setNewMenu({ ...newMenu, categoryId: cat.id, basePrice: parseInt(e.target.value) || 0 })} />
                      <input type="text" placeholder="価格の注釈 (例: ゴミ屋敷レベルは+3300円〜)" className="flex-1 p-2 border rounded text-black text-sm" value={newMenu.categoryId === cat.id ? newMenu.priceNote : ""} onChange={(e) => setNewMenu({ ...newMenu, categoryId: cat.id, priceNote: e.target.value })} />
                    </div>
                    <div className="flex gap-2 items-center">
                      <input type="number" placeholder="最短時間(分)" className="w-28 p-2 border rounded text-black text-sm" value={newMenu.categoryId === cat.id ? newMenu.durationMin || "" : ""} onChange={(e) => setNewMenu({ ...newMenu, categoryId: cat.id, durationMin: parseInt(e.target.value) || 0 })} />
                      <input type="number" placeholder="最長時間(分・任意)" className="w-32 p-2 border rounded text-black text-sm" value={newMenu.categoryId === cat.id ? newMenu.durationMax || "" : ""} onChange={(e) => setNewMenu({ ...newMenu, categoryId: cat.id, durationMax: parseInt(e.target.value) || 0 })} />
                      <select className="p-2 border rounded text-black text-sm" value={newMenu.categoryId === cat.id ? newMenu.onSiteEstimate : "NONE"} onChange={(e) => setNewMenu({ ...newMenu, categoryId: cat.id, onSiteEstimate: e.target.value })}>
                        {Object.entries(ON_SITE_ESTIMATE_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                      </select>
                    </div>
                  </div>
                  <textarea placeholder="作業内容 (改行で箇条書き)" rows={3} className="w-full p-2 border rounded text-black text-sm" value={newMenu.categoryId === cat.id ? newMenu.workContent : ""} onChange={(e) => setNewMenu({ ...newMenu, categoryId: cat.id, workContent: e.target.value })} />
                  <input type="text" placeholder="おすすめポイント (任意)" className="w-full p-2 border rounded text-black text-sm" value={newMenu.categoryId === cat.id ? newMenu.recommendPoint : ""} onChange={(e) => setNewMenu({ ...newMenu, categoryId: cat.id, recommendPoint: e.target.value })} />
                  <textarea placeholder="注意事項 (任意)" rows={2} className="w-full p-2 border rounded text-black text-sm" value={newMenu.categoryId === cat.id ? newMenu.cautionNote : ""} onChange={(e) => setNewMenu({ ...newMenu, categoryId: cat.id, cautionNote: e.target.value })} />
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} max={99} step={0.1} placeholder="個別値引き% (任意・空欄で無し)" className="w-56 p-2 border rounded text-black text-sm" value={newMenu.categoryId === cat.id ? newMenu.discountPercent : ""} onChange={(e) => setNewMenu({ ...newMenu, categoryId: cat.id, discountPercent: e.target.value })} />
                    <RoundingSelect value={(newMenu.categoryId === cat.id ? newMenu.discountRounding : "NONE") as RoundingMode} onChange={(discountRounding) => setNewMenu({ ...newMenu, categoryId: cat.id, discountRounding })} />
                  </div>
                  <button onClick={() => { handleAction("POST", { type: "menu", categoryId: cat.id, title: newMenu.title, basePrice: newMenu.basePrice, priceNote: newMenu.priceNote, workContent: newMenu.workContent, cautionNote: newMenu.cautionNote, recommendPoint: newMenu.recommendPoint, onSiteEstimate: newMenu.onSiteEstimate, durationMin: newMenu.durationMin, durationMax: newMenu.durationMax || null, discountPercent: newMenu.discountPercent || null, discountRounding: newMenu.discountRounding, order: cat.menus.length }); setNewMenu({ categoryId: "", title: "", basePrice: 0, priceNote: "", workContent: "", cautionNote: "", recommendPoint: "", onSiteEstimate: "NONE", durationMin: 60, durationMax: 0, discountPercent: "", discountRounding: "NONE" }); }} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold shadow-sm">中分類を追加</button>
                </div>

                {/* 【2階層目】中分類リスト */}
                {cat.menus.map((menu, menuIdx) => (
                  <div key={menu.id} className="border-2 border-blue-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
                    
                    {/* --- 中分類タイトル & 価格 --- */}
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      {editingId === menu.id ? (
                        <div className="flex gap-2 flex-1 flex-col bg-yellow-50 p-2 rounded">
                          <div className="flex gap-2">
                            <input className="flex-1 p-1 border rounded text-black text-sm font-bold" value={editData.title} onChange={(e) => setEditData((prev:any) => ({...prev, title: e.target.value}))} placeholder="中分類名" />
                          </div>
                          <div className="flex gap-2 items-center flex-wrap">
                            <span className="text-xs font-bold text-gray-500">基本料金:</span><input type="number" className="w-24 p-1 border rounded text-black text-sm" value={editData.basePrice || 0} onChange={(e) => setEditData((prev:any) => ({...prev, basePrice: parseInt(e.target.value) || 0}))} />
                            <span className="text-xs font-bold text-gray-500">注釈:</span><input type="text" className="flex-1 p-1 border rounded text-black text-sm" value={editData.priceNote || ""} onChange={(e) => setEditData((prev:any) => ({...prev, priceNote: e.target.value}))} placeholder="(例: +3300円〜)" />
                            <span className="text-xs font-bold text-gray-500">最短(分):</span><input type="number" className="w-16 p-1 border rounded text-black text-sm" value={editData.durationMin || 0} onChange={(e) => setEditData((prev:any) => ({...prev, durationMin: parseInt(e.target.value) || 0}))} />
                            <span className="text-xs font-bold text-gray-500">最長(分):</span><input type="number" className="w-16 p-1 border rounded text-black text-sm" value={editData.durationMax || 0} onChange={(e) => setEditData((prev:any) => ({...prev, durationMax: parseInt(e.target.value) || 0}))} />
                            <select className="p-1 border rounded text-black text-sm" value={editData.onSiteEstimate || "NONE"} onChange={(e) => setEditData((prev:any) => ({...prev, onSiteEstimate: e.target.value}))}>
                              {Object.entries(ON_SITE_ESTIMATE_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                            </select>
                          </div>
                          <textarea className="w-full p-1 border rounded text-black text-sm" rows={3} value={editData.workContent || ""} onChange={(e) => setEditData((prev:any) => ({...prev, workContent: e.target.value}))} placeholder="作業内容" />
                          <input type="text" className="w-full p-1 border rounded text-black text-sm" value={editData.recommendPoint || ""} onChange={(e) => setEditData((prev:any) => ({...prev, recommendPoint: e.target.value}))} placeholder="おすすめポイント" />
                          <textarea className="w-full p-1 border rounded text-black text-sm" rows={2} value={editData.cautionNote || ""} onChange={(e) => setEditData((prev:any) => ({...prev, cautionNote: e.target.value}))} placeholder="注意事項" />
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-red-600">個別値引き%(空欄で無し):</span>
                            <input type="number" min={0} max={99} step={0.1} className="w-20 p-1 border rounded text-black text-sm" value={editData.discountPercent ?? ""} onChange={(e) => setEditData((prev:any) => ({...prev, discountPercent: e.target.value === "" ? null : parseFloat(e.target.value) || null}))} />
                            <RoundingSelect value={editData.discountRounding} onChange={(discountRounding) => setEditData((prev: any) => ({ ...prev, discountRounding }))} />
                          </div>
                          <SetDiscountEditor value={editData.setDiscountRules ?? null} onChange={(v) => setEditData((prev: any) => ({ ...prev, setDiscountRules: v }))} />
                          <div className="ml-auto flex gap-2 mt-2">
                            <button onClick={saveEdit} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">保存</button>
                            <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-3 py-1 rounded text-xs font-bold">中止</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 w-full">
                          <div className="flex flex-col gap-0.5 mt-1">
                            <button onClick={() => handleMove(menuIdx, "up", cat.menus, "menu")} className="text-[10px] bg-gray-100 hover:bg-gray-200 px-1 rounded">↑</button>
                            <button onClick={() => handleMove(menuIdx, "down", cat.menus, "menu")} className="text-[10px] bg-gray-100 hover:bg-gray-200 px-1 rounded">↓</button>
                          </div>
                          <div className="flex-1 flex flex-col gap-2">
                            <div className="flex items-center gap-4 flex-wrap">
                              <h3 className="font-bold text-blue-800 text-lg">📄 {menu.title}</h3>
                              {menu.discountPercent ? (
                                <span className="text-sm font-bold bg-slate-100 px-2 py-1 rounded">
                                  <span className="text-slate-400 line-through mr-1">{menu.basePrice.toLocaleString()}円</span>
                                  <span className="text-red-600">{roundAmount(menu.basePrice * (100 - menu.discountPercent) / 100, menu.discountRounding).toLocaleString()}円</span>
                                </span>
                              ) : (
                                <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">{menu.basePrice.toLocaleString()}円</span>
                              )}
                              {menu.discountPercent ? <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{discountLabel(menu.discountPercent, menu.discountRounding)}OFF</span> : null}
                              {menu.priceNote && <span className="text-xs text-red-600 font-bold">{menu.priceNote}</span>}
                              <span className="text-xs text-slate-500">({menu.durationMin}{menu.durationMax ? `〜${menu.durationMax}` : ""}分)</span>
                              {menu.onSiteEstimate !== "NONE" && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{ON_SITE_ESTIMATE_LABEL[menu.onSiteEstimate]}</span>}
                              {menu.recommendPoint && <span className="text-[10px] text-pink-600">✨ {menu.recommendPoint}</span>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(menu, "menu")} className="text-blue-500 text-xs hover:underline font-bold">編集</button>
                            <button onClick={() => startDuplicate(menu, "menu")} className="text-purple-500 text-xs hover:underline font-bold">複製</button>
                            <button onClick={() => handleAction("DELETE", { id: menu.id, type: "menu" })} className="text-red-500 text-xs hover:underline font-bold">削除</button>
                          </div>
                        </div>
                      )}
                      {duplicating?.type === "menu" && duplicating.source.id === menu.id && (
                        <div className="flex items-center gap-2 bg-purple-50 border border-purple-300 rounded p-2 mt-2 w-full flex-wrap">
                          <span className="text-xs font-bold text-purple-800">「{menu.title}」のコピー先の大分類:</span>
                          <select value={duplicateTargetId} onChange={(e) => setDuplicateTargetId(e.target.value)} className="p-1 border rounded text-xs">
                            {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                          </select>
                          <button onClick={runDuplicate} className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold hover:bg-purple-700">複製実行</button>
                          <button onClick={() => setDuplicating(null)} className="bg-gray-400 text-white px-2 py-1 rounded text-xs font-bold">キャンセル</button>
                        </div>
                      )}
                    </div>

                    <div className="pl-6 border-l-2 border-slate-100 space-y-6">

                      {/* --- 作業内容 --- */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 border-l-4 border-slate-300 pl-2">作業内容</h4>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {menu.workContent ? menu.workContent : <span className="text-slate-400 italic">未設定</span>}
                        </div>
                      </div>
                      
                      {/* 【3階層目】小分類リスト (オプション等) */}
                      <div>
                        <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 border-l-4 border-orange-300 pl-2">オプション</h4>
                        {menu.subMenus.map((subMenu, subMenuIdx) => (
                          <div key={subMenu.id} className="bg-orange-50 border border-orange-100 rounded-lg p-4 space-y-4 mb-3">
                            <div className="flex justify-between items-center border-b border-orange-200 pb-2">
                              {editingId === subMenu.id ? (
                                <div className="flex gap-2 flex-1 flex-col bg-yellow-50 p-2 rounded">
                                  <div className="flex gap-2 items-center flex-wrap">
                                    <input className="flex-1 p-1 border rounded text-black text-xs font-bold" value={editData.title} onChange={(e) => setEditData((prev:any) => ({...prev, title: e.target.value}))} placeholder="小分類名" />
                                    <span className="text-xs font-bold text-gray-500">追加料金:</span><input type="number" className="w-20 p-1 border rounded text-black text-xs" value={editData.price || 0} onChange={(e) => setEditData((prev:any) => ({...prev, price: parseInt(e.target.value) || 0}))} />
                                    <span className="text-xs font-bold text-gray-500">最短(分):</span><input type="number" className="w-14 p-1 border rounded text-black text-xs" value={editData.durationMin || 0} onChange={(e) => setEditData((prev:any) => ({...prev, durationMin: parseInt(e.target.value) || 0}))} />
                                    <span className="text-xs font-bold text-gray-500">最長(分):</span><input type="number" className="w-14 p-1 border rounded text-black text-xs" value={editData.durationMax || 0} onChange={(e) => setEditData((prev:any) => ({...prev, durationMax: parseInt(e.target.value) || 0}))} />
                                    <select className="p-1 border rounded text-black text-xs" value={editData.onSiteEstimate || "NONE"} onChange={(e) => setEditData((prev:any) => ({...prev, onSiteEstimate: e.target.value}))}>
                                      {Object.entries(ON_SITE_ESTIMATE_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                                    </select>
                                  </div>
                                  <input type="text" className="w-full p-1 border rounded text-black text-xs" value={editData.workContent || ""} onChange={(e) => setEditData((prev:any) => ({...prev, workContent: e.target.value}))} placeholder="作業内容" />
                                  <input type="text" className="w-full p-1 border rounded text-black text-xs" value={editData.recommendPoint || ""} onChange={(e) => setEditData((prev:any) => ({...prev, recommendPoint: e.target.value}))} placeholder="おすすめポイント" />
                                  <input type="text" className="w-full p-1 border rounded text-black text-xs" value={editData.cautionNote || ""} onChange={(e) => setEditData((prev:any) => ({...prev, cautionNote: e.target.value}))} placeholder="注意事項" />
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-red-600">個別値引き%(空欄で無し):</span>
                                    <input type="number" min={0} max={99} step={0.1} className="w-16 p-1 border rounded text-black text-xs" value={editData.discountPercent ?? ""} onChange={(e) => setEditData((prev:any) => ({...prev, discountPercent: e.target.value === "" ? null : parseFloat(e.target.value) || null}))} />
                                    <RoundingSelect value={editData.discountRounding} onChange={(discountRounding) => setEditData((prev: any) => ({ ...prev, discountRounding }))} />
                                  </div>
                                  <div className="ml-auto flex gap-1">
                                    <button onClick={saveEdit} className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold">保存</button>
                                    <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-2 py-1 rounded text-[10px] font-bold">中止</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 w-full">
                                  <div className="flex flex-col gap-0.5">
                                    <button onClick={() => handleMove(subMenuIdx, "up", menu.subMenus, "submenu")} className="text-[10px] bg-white border hover:bg-gray-100 px-1 rounded">↑</button>
                                    <button onClick={() => handleMove(subMenuIdx, "down", menu.subMenus, "submenu")} className="text-[10px] bg-white border hover:bg-gray-100 px-1 rounded">↓</button>
                                  </div>
                                  <div className="flex-1 flex items-center gap-3 flex-wrap">
                                    <h4 className="font-bold text-orange-900 text-sm">➖ {subMenu.title}</h4>
                                    {subMenu.discountPercent ? (
                                      <span className="text-xs font-bold bg-white px-2 py-0.5 border rounded shadow-sm">
                                        <span className="text-slate-400 line-through mr-1">+{subMenu.price.toLocaleString()}円</span>
                                        <span className="text-red-600">+{roundAmount(subMenu.price * (100 - subMenu.discountPercent) / 100, subMenu.discountRounding).toLocaleString()}円</span>
                                        {" "}/ +{subMenu.durationMin}{subMenu.durationMax ? `〜${subMenu.durationMax}` : ""}分
                                      </span>
                                    ) : (
                                      <span className="text-xs font-bold text-orange-700 bg-white px-2 py-0.5 border rounded shadow-sm">+{subMenu.price.toLocaleString()}円 / +{subMenu.durationMin}{subMenu.durationMax ? `〜${subMenu.durationMax}` : ""}分</span>
                                    )}
                                    {subMenu.discountPercent ? <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{discountLabel(subMenu.discountPercent, subMenu.discountRounding)}OFF</span> : null}
                                    {subMenu.onSiteEstimate !== "NONE" && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{ON_SITE_ESTIMATE_LABEL[subMenu.onSiteEstimate]}</span>}
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => startEdit(subMenu, "submenu")} className="text-blue-500 text-xs hover:underline">編集</button>
                                    <button onClick={() => startDuplicate(subMenu, "submenu")} className="text-purple-500 text-xs hover:underline">複製</button>
                                    <button onClick={() => handleAction("DELETE", { id: subMenu.id, type: "submenu" })} className="text-red-500 text-xs hover:underline">削除</button>
                                  </div>
                                </div>
                              )}
                              {duplicating?.type === "submenu" && duplicating.source.id === subMenu.id && (
                                <div className="flex items-center gap-2 bg-purple-50 border border-purple-300 rounded p-2 mt-2 w-full flex-wrap">
                                  <span className="text-xs font-bold text-purple-800">「{subMenu.title}」のコピー先の中分類:</span>
                                  <select value={duplicateTargetId} onChange={(e) => setDuplicateTargetId(e.target.value)} className="p-1 border rounded text-xs">
                                    {categories.map(c => (
                                      <optgroup key={c.id} label={c.title}>
                                        {c.menus.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                      </optgroup>
                                    ))}
                                  </select>
                                  <button onClick={runDuplicate} className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold hover:bg-purple-700">複製実行</button>
                                  <button onClick={() => setDuplicating(null)} className="bg-gray-400 text-white px-2 py-1 rounded text-xs font-bold">キャンセル</button>
                                </div>
                              )}
                            </div>

                            {/* 【4階層目】極小分類 (サブオプション) リスト */}
                            <div className="pl-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                {subMenu.options.map((opt, optIdx) => (
                                  <div key={opt.id} className="bg-white border border-orange-100 p-2 rounded flex justify-between items-center text-xs shadow-sm">
                                    {editingId === opt.id ? (
                                      <div className="flex flex-col gap-1 w-full">
                                        <div className="flex gap-1 items-center flex-wrap">
                                          <input className="flex-1 p-1 border rounded text-black text-[10px]" value={editData.title} onChange={(e) => setEditData((prev:any) => ({...prev, title: e.target.value}))} placeholder="追加オプション名" />
                                          <input type="number" className="w-14 p-1 border rounded text-black text-[10px]" value={editData.price || 0} onChange={(e) => setEditData((prev:any) => ({...prev, price: parseInt(e.target.value) || 0}))} placeholder="円" />
                                          <input type="number" className="w-12 p-1 border rounded text-black text-[10px]" value={editData.durationMin || 0} onChange={(e) => setEditData((prev:any) => ({...prev, durationMin: parseInt(e.target.value) || 0}))} placeholder="最短分" />
                                          <input type="number" className="w-12 p-1 border rounded text-black text-[10px]" value={editData.durationMax || 0} onChange={(e) => setEditData((prev:any) => ({...prev, durationMax: parseInt(e.target.value) || 0}))} placeholder="最長分" />
                                          <select className="p-1 border rounded text-black text-[10px]" value={editData.onSiteEstimate || "NONE"} onChange={(e) => setEditData((prev:any) => ({...prev, onSiteEstimate: e.target.value}))}>
                                            {Object.entries(ON_SITE_ESTIMATE_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                                          </select>
                                          <input type="number" min={1} className="w-16 p-1 border rounded text-black text-[10px]" placeholder="上限個数(空欄=無制限)" value={editData.maxQty ?? ""} onChange={(e) => setEditData((prev:any) => ({...prev, maxQty: e.target.value === "" ? null : parseInt(e.target.value) || null}))} />
                                          <input type="number" min={0} max={99} step={0.1} className="w-16 p-1 border rounded text-black text-[10px]" placeholder="値引き%(空欄で無し)" value={editData.discountPercent ?? ""} onChange={(e) => setEditData((prev:any) => ({...prev, discountPercent: e.target.value === "" ? null : parseFloat(e.target.value) || null}))} />
                                          <RoundingSelect value={editData.discountRounding} onChange={(discountRounding) => setEditData((prev: any) => ({ ...prev, discountRounding }))} />
                                          <button onClick={saveEdit} className="bg-green-600 text-white px-1.5 py-0.5 rounded">✓</button>
                                          <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-1.5 py-0.5 rounded">×</button>
                                        </div>
                                        <QtyDiscountEditor value={editData.qtyDiscountRules ?? null} onChange={(v) => setEditData((prev: any) => ({ ...prev, qtyDiscountRules: v }))} />
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-center gap-1">
                                          <button onClick={() => handleMove(optIdx, "up", subMenu.options, "option")} className="text-[8px] text-gray-400 hover:text-gray-700">▲</button>
                                          <button onClick={() => handleMove(optIdx, "down", subMenu.options, "option")} className="text-[8px] text-gray-400 hover:text-gray-700">▼</button>
                                          <span className="font-bold text-orange-900 ml-1">{opt.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {opt.discountPercent ? (
                                            <span className="font-bold">
                                              <span className="text-slate-400 line-through mr-1">+{opt.price.toLocaleString()}円</span>
                                              <span className="text-red-600">+{roundAmount(opt.price * (100 - opt.discountPercent) / 100, opt.discountRounding).toLocaleString()}円</span>
                                            </span>
                                          ) : (
                                            <span className="font-bold text-orange-600">+{opt.price.toLocaleString()}円</span>
                                          )}
                                          <span className="text-[10px] text-orange-600 bg-orange-100 px-1 rounded">+{opt.durationMin}{opt.durationMax ? `〜${opt.durationMax}` : ""}分</span>
                                          {opt.onSiteEstimate !== "NONE" && <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1 rounded-full">{ON_SITE_ESTIMATE_LABEL[opt.onSiteEstimate]}</span>}
                                          <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1 rounded-full">{opt.maxQty ? `上限${opt.maxQty}個` : "個数無制限"}</span>
                                          {opt.discountPercent ? <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1 rounded-full">{discountLabel(opt.discountPercent, opt.discountRounding)}OFF</span> : null}
                                          <button onClick={() => startEdit(opt, "option")} className="text-blue-400 text-[10px] hover:underline ml-1">✎</button>
                                          <button onClick={() => startDuplicate(opt, "option")} className="text-purple-400 text-[10px] hover:underline">複製</button>
                                          <button onClick={() => handleAction("DELETE", { id: opt.id, type: "option" })} className="text-red-400 text-[10px] hover:underline font-bold">×</button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {duplicating?.type === "option" && subMenu.options.some(o => o.id === duplicating.source.id) && (
                                <div className="flex items-center gap-2 bg-purple-50 border border-purple-300 rounded p-2 mb-3 w-full flex-wrap">
                                  <span className="text-xs font-bold text-purple-800">「{duplicating.source.title}」のコピー先の小分類:</span>
                                  <select value={duplicateTargetId} onChange={(e) => setDuplicateTargetId(e.target.value)} className="p-1 border rounded text-xs">
                                    {categories.map(c => (
                                      <optgroup key={c.id} label={c.title}>
                                        {c.menus.flatMap(m => m.subMenus.map(s => <option key={s.id} value={s.id}>{m.title} ➖ {s.title}</option>))}
                                      </optgroup>
                                    ))}
                                  </select>
                                  <button onClick={runDuplicate} className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold hover:bg-purple-700">複製実行</button>
                                  <button onClick={() => setDuplicating(null)} className="bg-gray-400 text-white px-2 py-1 rounded text-xs font-bold">キャンセル</button>
                                </div>
                              )}

                              {/* 追加オプション追加フォーム */}
                              <div className="flex gap-2 items-center bg-white p-2 rounded border border-orange-200 flex-wrap">
                                <input type="text" placeholder="追加オプションを追加" className="flex-1 p-1.5 border rounded text-black text-xs" value={newOption.subMenuId === subMenu.id ? newOption.title : ""} onChange={(e) => setNewOption({ ...newOption, subMenuId: subMenu.id, title: e.target.value })} />
                                <input type="number" placeholder="加算(円)" className="w-16 p-1.5 border rounded text-black text-xs" value={newOption.subMenuId === subMenu.id ? newOption.price || "" : ""} onChange={(e) => setNewOption({ ...newOption, subMenuId: subMenu.id, price: parseInt(e.target.value) || 0 })} />
                                <input type="number" placeholder="最短(分)" className="w-16 p-1.5 border rounded text-black text-xs" value={newOption.subMenuId === subMenu.id ? newOption.durationMin || "" : ""} onChange={(e) => setNewOption({ ...newOption, subMenuId: subMenu.id, durationMin: parseInt(e.target.value) || 0 })} />
                                <input type="number" placeholder="最長(分)" className="w-16 p-1.5 border rounded text-black text-xs" value={newOption.subMenuId === subMenu.id ? newOption.durationMax || "" : ""} onChange={(e) => setNewOption({ ...newOption, subMenuId: subMenu.id, durationMax: parseInt(e.target.value) || 0 })} />
                                <select className="p-1.5 border rounded text-black text-xs" value={newOption.subMenuId === subMenu.id ? newOption.onSiteEstimate : "NONE"} onChange={(e) => setNewOption({ ...newOption, subMenuId: subMenu.id, onSiteEstimate: e.target.value })}>
                                  {Object.entries(ON_SITE_ESTIMATE_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                                </select>
                                <input type="number" min={1} placeholder="上限個数(空欄=無制限)" className="w-24 p-1.5 border rounded text-black text-xs" value={newOption.subMenuId === subMenu.id ? newOption.maxQty : ""} onChange={(e) => setNewOption({ ...newOption, subMenuId: subMenu.id, maxQty: e.target.value })} />
                                <input type="number" min={0} max={99} step={0.1} placeholder="値引き%(任意)" className="w-24 p-1.5 border rounded text-black text-xs" value={newOption.subMenuId === subMenu.id ? newOption.discountPercent : ""} onChange={(e) => setNewOption({ ...newOption, subMenuId: subMenu.id, discountPercent: e.target.value })} />
                                <RoundingSelect value={(newOption.subMenuId === subMenu.id ? newOption.discountRounding : "NONE") as RoundingMode} onChange={(discountRounding) => setNewOption({ ...newOption, subMenuId: subMenu.id, discountRounding })} />
                                <button onClick={() => { handleAction("POST", { type: "option", subMenuId: subMenu.id, title: newOption.title, price: newOption.price, durationMin: newOption.durationMin, durationMax: newOption.durationMax || null, onSiteEstimate: newOption.onSiteEstimate, maxQty: newOption.maxQty || null, discountPercent: newOption.discountPercent || null, discountRounding: newOption.discountRounding, qtyDiscountRules: newOption.qtyDiscountRules ?? undefined, order: subMenu.options.length }); setNewOption({ subMenuId: "", title: "", price: 0, durationMin: 0, durationMax: 0, workContent: "", cautionNote: "", recommendPoint: "", onSiteEstimate: "NONE", maxQty: "", discountPercent: "", discountRounding: "NONE", qtyDiscountRules: null }); }} className="bg-orange-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-orange-600">追加</button>
                                <div className="w-full">
                                  <QtyDiscountEditor
                                    value={newOption.subMenuId === subMenu.id ? newOption.qtyDiscountRules : null}
                                    onChange={(v) => setNewOption({ ...newOption, subMenuId: subMenu.id, qtyDiscountRules: v })}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* 小分類追加フォーム */}
                        <div className="flex flex-col gap-2 bg-white p-3 rounded border border-slate-200 mt-2 shadow-sm">
                          <div className="flex gap-2 items-center flex-wrap">
                            <input type="text" placeholder="小分類を追加 (例: 排水管高圧洗浄)" className="flex-1 p-2 border rounded text-black text-xs" value={newSubMenu.menuId === menu.id ? newSubMenu.title : ""} onChange={(e) => setNewSubMenu({ ...newSubMenu, menuId: menu.id, title: e.target.value })} />
                            <input type="number" placeholder="加算(円)" className="w-20 p-2 border rounded text-black text-xs" value={newSubMenu.menuId === menu.id ? newSubMenu.price || "" : ""} onChange={(e) => setNewSubMenu({ ...newSubMenu, menuId: menu.id, price: parseInt(e.target.value) || 0 })} />
                            <input type="number" placeholder="最短(分)" className="w-20 p-2 border rounded text-black text-xs" value={newSubMenu.menuId === menu.id ? newSubMenu.durationMin || "" : ""} onChange={(e) => setNewSubMenu({ ...newSubMenu, menuId: menu.id, durationMin: parseInt(e.target.value) || 0 })} />
                            <input type="number" placeholder="最長(分)" className="w-20 p-2 border rounded text-black text-xs" value={newSubMenu.menuId === menu.id ? newSubMenu.durationMax || "" : ""} onChange={(e) => setNewSubMenu({ ...newSubMenu, menuId: menu.id, durationMax: parseInt(e.target.value) || 0 })} />
                            <select className="p-2 border rounded text-black text-xs" value={newSubMenu.menuId === menu.id ? newSubMenu.onSiteEstimate : "NONE"} onChange={(e) => setNewSubMenu({ ...newSubMenu, menuId: menu.id, onSiteEstimate: e.target.value })}>
                              {Object.entries(ON_SITE_ESTIMATE_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                            </select>
                          </div>
                          <div className="flex gap-2 items-center flex-wrap">
                            <input type="text" placeholder="作業内容 (任意)" className="flex-1 p-2 border rounded text-black text-xs" value={newSubMenu.menuId === menu.id ? newSubMenu.workContent : ""} onChange={(e) => setNewSubMenu({ ...newSubMenu, menuId: menu.id, workContent: e.target.value })} />
                            <input type="text" placeholder="おすすめポイント (任意)" className="flex-1 p-2 border rounded text-black text-xs" value={newSubMenu.menuId === menu.id ? newSubMenu.recommendPoint : ""} onChange={(e) => setNewSubMenu({ ...newSubMenu, menuId: menu.id, recommendPoint: e.target.value })} />
                            <input type="text" placeholder="注意事項 (任意)" className="flex-1 p-2 border rounded text-black text-xs" value={newSubMenu.menuId === menu.id ? newSubMenu.cautionNote : ""} onChange={(e) => setNewSubMenu({ ...newSubMenu, menuId: menu.id, cautionNote: e.target.value })} />
                            <input type="number" min={0} max={99} step={0.1} placeholder="個別値引き%(任意)" className="w-36 p-2 border rounded text-black text-xs" value={newSubMenu.menuId === menu.id ? newSubMenu.discountPercent : ""} onChange={(e) => setNewSubMenu({ ...newSubMenu, menuId: menu.id, discountPercent: e.target.value })} />
                            <RoundingSelect value={(newSubMenu.menuId === menu.id ? newSubMenu.discountRounding : "NONE") as RoundingMode} onChange={(discountRounding) => setNewSubMenu({ ...newSubMenu, menuId: menu.id, discountRounding })} />
                          </div>
                          <button onClick={() => { handleAction("POST", { type: "submenu", menuId: menu.id, title: newSubMenu.title, price: newSubMenu.price, durationMin: newSubMenu.durationMin, durationMax: newSubMenu.durationMax || null, onSiteEstimate: newSubMenu.onSiteEstimate, workContent: newSubMenu.workContent, recommendPoint: newSubMenu.recommendPoint, cautionNote: newSubMenu.cautionNote, discountPercent: newSubMenu.discountPercent || null, discountRounding: newSubMenu.discountRounding, order: menu.subMenus.length }); setNewSubMenu({ menuId: "", title: "", price: 0, durationMin: 0, durationMax: 0, workContent: "", cautionNote: "", recommendPoint: "", onSiteEstimate: "NONE", discountPercent: "", discountRounding: "NONE" }); }} className="self-end bg-slate-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-slate-700">小分類追加</button>
                        </div>
                      </div>

                      {/* --- 注意事項 --- */}
                      <div>
                        <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2 border-l-4 border-red-300 pl-2">注意事項</h4>
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {menu.cautionNote ? menu.cautionNote : <span className="text-slate-400 italic">未入力（編集から追加できます）</span>}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}