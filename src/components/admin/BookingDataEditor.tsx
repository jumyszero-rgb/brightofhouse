// @/src/components/admin/BookingDataEditor.tsx
// サービス詳細ページ・LPなど、複数のページ種別から使い回せる予約メニュービルダー。
// 呼び出し側は value/onChange で bookingData の状態を持ち、このコンポーネントは表示・編集のみを担当する。
"use client";

import type { ReactNode } from "react";

export type FoldItem = {
  id: string;
  title: string;
  price: number;
  durationMin: number;
  durationMax: number;
  comment: string;
  cautionNote: string;
};

export type OptionItem = {
  id: string;
  title: string;
  price: number;
  durationMin: number;
  durationMax: number;
  maxQty: number;
  comment: string;
  parentFoldItemId?: string; // どのfoldItemに紐づくか
};

export type DiscountRule = {
  count: number; // 2〜10
  value: number; // 金額 or パーセント
};

export type SetDiscount = {
  enabled: boolean;
  type: "amount" | "percent"; // 円引き or %引き
  rules: DiscountRule[];
};

export type MainService = {
  id: string;
  title: string;
  price: number;
  durationMin: number;
  durationMax: number;
  foldTitle: string;
  foldItems: FoldItem[];
  options: OptionItem[];
  setDiscount: SetDiscount;
};

// 旧型（後方互換用）
export type LegacyOptionService = {
  id: string;
  title: string;
  price: number;
  durationMin: number;
  durationMax: number;
  maxQty: number;
  foldTitle: string;
  foldItems: FoldItem[];
};

export type BookingFormData = {
  mains: MainService[];
  legacyOptions?: LegacyOptionService[];
};

export function newFoldItem(): FoldItem {
  return { id: crypto.randomUUID(), title: "", price: 0, durationMin: 0, durationMax: 0, comment: "", cautionNote: "" };
}

export function newOptionItem(parentFoldItemId?: string): OptionItem {
  return { id: crypto.randomUUID(), title: "", price: 0, durationMin: 0, durationMax: 0, maxQty: 1, comment: "", parentFoldItemId };
}

export function newSetDiscount(): SetDiscount {
  return { enabled: false, type: "amount", rules: [] };
}

export function newMain(): MainService {
  return { id: crypto.randomUUID(), title: "", price: 0, durationMin: 60, durationMax: 60, foldTitle: "", foldItems: [], options: [], setDiscount: newSetDiscount() };
}

type Props = {
  value: BookingFormData;
  onChange: (next: BookingFormData) => void;
  title?: string;
  headerExtra?: ReactNode;
};

export default function BookingDataEditor({ value, onChange, title = "予約メニュー設定", headerExtra }: Props) {
  const update = (updater: (prev: BookingFormData) => BookingFormData) => onChange(updater(value));

  // ===== Main CRUD =====
  const moveMain = (idx: number, dir: number) => update(prev => {
    const arr = [...prev.mains]; const t = arr[idx]; arr[idx] = arr[idx + dir]; arr[idx + dir] = t;
    return { ...prev, mains: arr };
  });
  const addMain = () => update(prev => ({ ...prev, mains: [...prev.mains, newMain()] }));
  const removeMain = (id: string) => update(prev => ({ ...prev, mains: prev.mains.filter(m => m.id !== id) }));
  const updateMain = (id: string, field: string, val: any) => update(prev => ({
    ...prev, mains: prev.mains.map(m => m.id === id ? { ...m, [field]: val } : m)
  }));

  // ===== FoldItem CRUD =====
  const addMainFoldItem = (mainId: string) => update(prev => ({
    ...prev, mains: prev.mains.map(m => m.id === mainId ? { ...m, foldItems: [...m.foldItems, newFoldItem()] } : m)
  }));
  const removeMainFoldItem = (mainId: string, fiId: string) => update(prev => ({
    ...prev, mains: prev.mains.map(m => m.id === mainId ? {
      ...m,
      foldItems: m.foldItems.filter(fi => fi.id !== fiId),
      options: m.options.filter(o => o.parentFoldItemId !== fiId), // 紐づくオプションも削除
    } : m)
  }));
  const updateMainFoldItem = (mainId: string, fiId: string, field: string, val: any) => update(prev => ({
    ...prev, mains: prev.mains.map(m => m.id === mainId ? {
      ...m, foldItems: m.foldItems.map(fi => fi.id === fiId ? { ...fi, [field]: val } : fi)
    } : m)
  }));

  // ===== Option CRUD (メイン配下) =====
  const addMainOption = (mainId: string, parentFoldItemId?: string) => update(prev => ({
    ...prev, mains: prev.mains.map(m => m.id === mainId ? { ...m, options: [...m.options, newOptionItem(parentFoldItemId)] } : m)
  }));
  const removeMainOption = (mainId: string, optId: string) => update(prev => ({
    ...prev, mains: prev.mains.map(m => m.id === mainId ? { ...m, options: m.options.filter(o => o.id !== optId) } : m)
  }));
  const updateMainOption = (mainId: string, optId: string, field: string, val: any) => update(prev => ({
    ...prev, mains: prev.mains.map(m => m.id === mainId ? {
      ...m, options: m.options.map(o => o.id === optId ? { ...o, [field]: val } : o)
    } : m)
  }));

  // ===== SetDiscount =====
  const updateSetDiscount = (mainId: string, discount: SetDiscount) => update(prev => ({
    ...prev, mains: prev.mains.map(m => m.id === mainId ? { ...m, setDiscount: discount } : m)
  }));
  const addDiscountRule = (mainId: string) => {
    const main = value.mains.find(m => m.id === mainId);
    if (!main) return;
    const nextCount = main.setDiscount.rules.length > 0
      ? Math.min(10, Math.max(...main.setDiscount.rules.map(r => r.count)) + 1)
      : 2;
    if (nextCount > 10) return;
    updateSetDiscount(mainId, {
      ...main.setDiscount,
      rules: [...main.setDiscount.rules, { count: nextCount, value: 0 }]
    });
  };
  const removeDiscountRule = (mainId: string, count: number) => {
    const main = value.mains.find(m => m.id === mainId);
    if (!main) return;
    updateSetDiscount(mainId, {
      ...main.setDiscount,
      rules: main.setDiscount.rules.filter(r => r.count !== count)
    });
  };
  const updateDiscountRule = (mainId: string, count: number, val: number) => {
    const main = value.mains.find(m => m.id === mainId);
    if (!main) return;
    updateSetDiscount(mainId, {
      ...main.setDiscount,
      rules: main.setDiscount.rules.map(r => r.count === count ? { ...r, value: val } : r)
    });
  };

  // ===== Legacy Options CRUD（後方互換） =====
  const addLegacyOption = () => update(prev => ({
    ...prev, legacyOptions: [...(prev.legacyOptions || []), { id: crypto.randomUUID(), title: "", price: 0, durationMin: 0, durationMax: 0, maxQty: 1, foldTitle: "", foldItems: [] }]
  }));
  const removeLegacyOption = (id: string) => update(prev => ({
    ...prev, legacyOptions: (prev.legacyOptions || []).filter(o => o.id !== id)
  }));
  const updateLegacyOption = (id: string, field: string, val: any) => update(prev => ({
    ...prev, legacyOptions: (prev.legacyOptions || []).map(o => o.id === id ? { ...o, [field]: val } : o)
  }));
  const addLegacyOptionFoldItem = (optId: string) => update(prev => ({
    ...prev, legacyOptions: (prev.legacyOptions || []).map(o => o.id === optId ? { ...o, foldItems: [...o.foldItems, newFoldItem()] } : o)
  }));
  const removeLegacyOptionFoldItem = (optId: string, fiId: string) => update(prev => ({
    ...prev, legacyOptions: (prev.legacyOptions || []).map(o => o.id === optId ? { ...o, foldItems: o.foldItems.filter(fi => fi.id !== fiId) } : o)
  }));
  const updateLegacyOptionFoldItem = (optId: string, fiId: string, field: string, val: any) => update(prev => ({
    ...prev, legacyOptions: (prev.legacyOptions || []).map(o => o.id === optId ? {
      ...o, foldItems: o.foldItems.map(fi => fi.id === fiId ? { ...fi, [field]: val } : fi)
    } : o)
  }));

  // ===== Render helpers =====
  const renderFoldItemRow = (fi: FoldItem, mainId: string, idx: number) => (
    <div key={fi.id} className="bg-amber-50 p-3 rounded border border-amber-200 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-amber-700">メニュー {idx + 1}</span>
        <button type="button" onClick={() => removeMainFoldItem(mainId, fi.id)} className="text-red-500 text-xs font-bold hover:underline">削除</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
        <div className="md:col-span-4">
          <label className="block text-[10px] font-bold text-amber-600 mb-1">メニュー名</label>
          <input placeholder="例: キッチンクリーニング" value={fi.title} onChange={e => updateMainFoldItem(mainId, fi.id, "title", e.target.value)} className="w-full p-2 border rounded text-sm" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-amber-600 mb-1">価格(円)</label>
          <input type="number" value={fi.price || ""} onChange={e => updateMainFoldItem(mainId, fi.id, "price", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
        <div className="md:col-span-3">
          <label className="block text-[10px] font-bold text-amber-600 mb-1">最短(分)</label>
          <input type="number" value={fi.durationMin || ""} onChange={e => updateMainFoldItem(mainId, fi.id, "durationMin", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
        <div className="md:col-span-3">
          <label className="block text-[10px] font-bold text-amber-600 mb-1">最長(分)</label>
          <input type="number" value={fi.durationMax || ""} onChange={e => updateMainFoldItem(mainId, fi.id, "durationMax", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-amber-600 mb-1">コメント（任意）</label>
        <input placeholder="例: 6回分チケット購入が必要" value={fi.comment || ""} onChange={e => updateMainFoldItem(mainId, fi.id, "comment", e.target.value)} className="w-full p-2 border rounded text-sm bg-white" />
      </div>
      {/* 折り畳み注意事項 */}
      <div>
        <label className="block text-[10px] font-bold text-red-600 mb-1">⚠️ 注意事項（折り畳み表示・任意）</label>
        <textarea
          placeholder="例: ※当サービスは詰まり解消作業には対応しておりません。詰まりの場合は専門業者へご依頼ください。"
          value={fi.cautionNote || ""}
          onChange={e => updateMainFoldItem(mainId, fi.id, "cautionNote", e.target.value)}
          rows={3}
          className="w-full p-2 border rounded text-sm bg-red-50 border-red-200"
        />
      </div>

      {/* このメニューに紐づくオプション */}
      <div className="mt-2 pl-4 border-l-4 border-indigo-200 space-y-2">
        <p className="text-[10px] font-bold text-indigo-600">┗ オプション（{fi.title || "このメニュー"}に紐づく）</p>
        {value.mains.find(m => m.id === mainId)?.options.filter(o => o.parentFoldItemId === fi.id).map((opt, oIdx) => (
          <div key={opt.id} className="bg-indigo-50 p-2 rounded border border-indigo-200 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-indigo-500">オプション {oIdx + 1}</span>
              <button type="button" onClick={() => removeMainOption(mainId, opt.id)} className="text-red-500 text-[10px] font-bold hover:underline">削除</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-1 items-end">
              <div className="md:col-span-3">
                <input placeholder="オプション名" value={opt.title} onChange={e => updateMainOption(mainId, opt.id, "title", e.target.value)} className="w-full p-1.5 border rounded text-xs" />
              </div>
              <div className="md:col-span-2">
                <input type="number" placeholder="価格" value={opt.price || ""} onChange={e => updateMainOption(mainId, opt.id, "price", Number(e.target.value))} className="w-full p-1.5 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div className="md:col-span-2">
                <input type="number" placeholder="最短(分)" value={opt.durationMin || ""} onChange={e => updateMainOption(mainId, opt.id, "durationMin", Number(e.target.value))} className="w-full p-1.5 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div className="md:col-span-2">
                <input type="number" placeholder="最長(分)" value={opt.durationMax || ""} onChange={e => updateMainOption(mainId, opt.id, "durationMax", Number(e.target.value))} className="w-full p-1.5 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div className="md:col-span-1">
                <input type="number" placeholder="最大数" min={1} value={opt.maxQty || 1} onChange={e => updateMainOption(mainId, opt.id, "maxQty", Math.max(1, Number(e.target.value)))} className="w-full p-1.5 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div className="md:col-span-2">
                <input placeholder="コメント" value={opt.comment || ""} onChange={e => updateMainOption(mainId, opt.id, "comment", e.target.value)} className="w-full p-1.5 border rounded text-xs" />
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => addMainOption(mainId, fi.id)} className="text-[10px] bg-indigo-500 text-white px-2 py-1 rounded-full font-bold hover:bg-indigo-600">＋ オプション追加</button>
      </div>
    </div>
  );

  const renderSetDiscountUI = (main: MainService) => (
    <div className="bg-green-50 p-3 rounded-lg border border-green-200 space-y-3">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={main.setDiscount.enabled} onChange={() => updateSetDiscount(main.id, { ...main.setDiscount, enabled: !main.setDiscount.enabled })} className="w-4 h-4 accent-green-600" />
          <span className="text-sm font-bold text-green-800">セット値引きを有効にする</span>
        </label>
      </div>
      {main.setDiscount.enabled && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-green-700">値引き方式：</label>
            <select value={main.setDiscount.type} onChange={e => updateSetDiscount(main.id, { ...main.setDiscount, type: e.target.value as "amount" | "percent" })} className="p-1 border rounded text-xs">
              <option value="amount">円引き（合計から○円引き）</option>
              <option value="percent">%引き（合計から○%引き）</option>
            </select>
          </div>
          <div className="space-y-1">
            {main.setDiscount.rules.sort((a, b) => a.count - b.count).map(rule => (
              <div key={rule.count} className="flex items-center gap-2">
                <span className="text-xs font-bold text-green-700 w-16">{rule.count}点選択：</span>
                <input type="number" value={rule.value || ""} onChange={e => updateDiscountRule(main.id, rule.count, Number(e.target.value))} className="w-24 p-1 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <span className="text-xs text-green-600">{main.setDiscount.type === "amount" ? "円引き" : "%引き"}</span>
                <button type="button" onClick={() => removeDiscountRule(main.id, rule.count)} className="text-red-500 text-[10px] font-bold hover:underline">削除</button>
              </div>
            ))}
          </div>
          {main.setDiscount.rules.length < 9 && (
            <button type="button" onClick={() => addDiscountRule(main.id)} className="text-[10px] bg-green-600 text-white px-2 py-1 rounded-full font-bold hover:bg-green-700">＋ 値引きルール追加</button>
          )}
        </div>
      )}
    </div>
  );

  // ===== Legacy option render =====
  const renderLegacyFoldItemRow = (fi: FoldItem, optId: string, idx: number) => (
    <div key={fi.id} className="bg-amber-50 p-3 rounded border border-amber-200 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-amber-700">プラン {idx + 1}</span>
        <button type="button" onClick={() => removeLegacyOptionFoldItem(optId, fi.id)} className="text-red-500 text-xs font-bold hover:underline">削除</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
        <div className="md:col-span-4">
          <input placeholder="プラン名" value={fi.title} onChange={e => updateLegacyOptionFoldItem(optId, fi.id, "title", e.target.value)} className="w-full p-2 border rounded text-sm" />
        </div>
        <div className="md:col-span-2">
          <input type="number" placeholder="価格" value={fi.price || ""} onChange={e => updateLegacyOptionFoldItem(optId, fi.id, "price", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
        <div className="md:col-span-3">
          <input type="number" placeholder="最短(分)" value={fi.durationMin || ""} onChange={e => updateLegacyOptionFoldItem(optId, fi.id, "durationMin", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
        <div className="md:col-span-3">
          <input type="number" placeholder="最長(分)" value={fi.durationMax || ""} onChange={e => updateLegacyOptionFoldItem(optId, fi.id, "durationMax", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
      </div>
      <input placeholder="コメント" value={fi.comment || ""} onChange={e => updateLegacyOptionFoldItem(optId, fi.id, "comment", e.target.value)} className="w-full p-2 border rounded text-sm bg-white" />
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-emerald-800">📅 {title}</h2>
        {headerExtra}
      </div>

      {/* メインサービス */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm font-bold text-emerald-700 border-b pb-2">メインサービスの設定</p>
          <button type="button" onClick={addMain} className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-full font-bold hover:bg-emerald-700">＋ メインサービスを追加</button>
        </div>
        {value.mains.map((main, idx) => (
          <div key={main.id} className="bg-white p-4 rounded-lg border border-emerald-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => moveMain(idx, -1)} disabled={idx === 0} className="text-xs px-2 py-1 bg-slate-200 rounded disabled:opacity-30 font-bold">▲</button>
                <button type="button" onClick={() => moveMain(idx, 1)} disabled={idx === value.mains.length - 1} className="text-xs px-2 py-1 bg-slate-200 rounded disabled:opacity-30 font-bold">▼</button>
                <p className="text-xs font-bold text-emerald-600">メインサービス {idx + 1}</p>
              </div>
              {value.mains.length > 1 && (
                <button type="button" onClick={() => removeMain(main.id)} className="text-red-500 text-xs font-bold hover:underline">削除</button>
              )}
            </div>

            {/* 折り畳みタイトル */}
            <div>
              <label className="block text-[10px] font-bold text-amber-600 mb-1">▼ 折り畳みタイトル（入力すると折り畳みグループになります）</label>
              <input placeholder="例: 水回りクリーニング（空欄 = 折り畳みなし）" value={main.foldTitle} onChange={e => updateMain(main.id, "foldTitle", e.target.value)} className="w-full p-2 border rounded text-sm bg-amber-50" />
            </div>

            {/* 折り畳みなし → 通常の単体表示 */}
            {!main.foldTitle && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">サービス名</label>
                  <input placeholder="例: 浴室全体清掃" value={main.title} onChange={e => updateMain(main.id, "title", e.target.value)} className="w-full p-2 border rounded text-sm bg-slate-50" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">価格(円)</label>
                  <input type="number" value={main.price || ""} onChange={e => updateMain(main.id, "price", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">最短(分)</label>
                  <input type="number" value={main.durationMin || ""} onChange={e => updateMain(main.id, "durationMin", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">最長(分)</label>
                  <input type="number" value={main.durationMax || ""} onChange={e => updateMain(main.id, "durationMax", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
              </div>
            )}

            {/* 折り畳みあり → 中にメニュー + オプション + セット値引き */}
            {main.foldTitle && (
              <div className="space-y-3 pl-4 border-l-4 border-amber-300">
                {main.foldItems.map((fi, fiIdx) => renderFoldItemRow(fi, main.id, fiIdx))}
                <button type="button" onClick={() => addMainFoldItem(main.id)} className="text-xs bg-amber-500 text-white px-3 py-1 rounded-full font-bold hover:bg-amber-600">＋ メニューを追加</button>

                {/* セット値引き設定 */}
                {main.foldItems.length >= 2 && renderSetDiscountUI(main)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 旧オプション（後方互換：既存データがある場合のみ表示） */}
      {value.legacyOptions && value.legacyOptions.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-orange-700">追加オプション（旧形式）</p>
              <p className="text-[10px] text-orange-500">※新しいメインサービスのオプションに移行することを推奨します</p>
            </div>
            <button type="button" onClick={addLegacyOption} className="text-xs bg-orange-500 text-white px-3 py-1 rounded-full font-bold hover:bg-orange-600">＋ 旧オプション追加</button>
          </div>
          {value.legacyOptions.map((opt, idx) => (
            <div key={opt.id} className="bg-white p-3 rounded-lg border border-orange-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-orange-600 font-bold">旧オプション {idx + 1}</span>
                <button type="button" onClick={() => removeLegacyOption(opt.id)} className="text-red-500 text-xs font-bold hover:underline">削除</button>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-amber-600 mb-1">▼ 折り畳みタイトル</label>
                <input placeholder="例: キッチンのオプション" value={opt.foldTitle} onChange={e => updateLegacyOption(opt.id, "foldTitle", e.target.value)} className="w-full p-2 border rounded text-xs bg-amber-50" />
              </div>
              {!opt.foldTitle && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-3">
                    <input placeholder="オプション名" value={opt.title} onChange={e => updateLegacyOption(opt.id, "title", e.target.value)} className="w-full p-2 border rounded text-xs" />
                  </div>
                  <div className="md:col-span-2">
                    <input type="number" placeholder="価格" value={opt.price || ""} onChange={e => updateLegacyOption(opt.id, "price", Number(e.target.value))} className="w-full p-2 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                  <div className="md:col-span-2">
                    <input type="number" placeholder="最短(分)" value={opt.durationMin || ""} onChange={e => updateLegacyOption(opt.id, "durationMin", Number(e.target.value))} className="w-full p-2 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                  <div className="md:col-span-2">
                    <input type="number" placeholder="最長(分)" value={opt.durationMax || ""} onChange={e => updateLegacyOption(opt.id, "durationMax", Number(e.target.value))} className="w-full p-2 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                  <div className="md:col-span-2">
                    <input type="number" placeholder="最大数" min={1} value={opt.maxQty || 1} onChange={e => updateLegacyOption(opt.id, "maxQty", Math.max(1, Number(e.target.value)))} className="w-full p-2 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                </div>
              )}
              {opt.foldTitle && (
                <div className="space-y-3 pl-4 border-l-4 border-amber-300">
                  <div className="mb-2">
                    <label className="block text-[10px] font-bold text-gray-300 mb-1">最大個数（グループ全体）</label>
                    <input type="number" min={1} value={opt.maxQty || 1} onChange={e => updateLegacyOption(opt.id, "maxQty", Math.max(1, Number(e.target.value)))} className="w-24 p-2 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                  {opt.foldItems.map((fi, fiIdx) => renderLegacyFoldItemRow(fi, opt.id, fiIdx))}
                  <button type="button" onClick={() => addLegacyOptionFoldItem(opt.id)} className="text-xs bg-amber-500 text-white px-3 py-1 rounded-full font-bold hover:bg-amber-600">＋ プランを追加</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
