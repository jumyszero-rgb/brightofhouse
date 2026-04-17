// @/src/app/admin/services/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// --- 型定義 ---
type Detail = { 
  id: string; label: string; value: string; 
  labelColor: string; labelSize: string; labelAlign: string;
  valueColor: string; valueSize: string; valueAlign: string;
  order: number 
};
type Option = { 
  id: string; title: string; subTitle: string | null; 
  regularPrice: string | null; price: number; additionalMinutes: number;
  discountType: string; discountValue: number;
  linkedItemId: string | null;
};
type Item = { 
  id: string; title: string; subTitle: string | null; 
  regularPrice: string | null; discountPrice: string | null; 
  basePrice: number; estimatedMinutes: number;
  notes: string | null;
  order: number; details: Detail[]; options: Option[] 
};
type Category = { id: string; title: string; order: number; items: Item[] };

// --- スタイル選択用共通コンポーネント ---
const StyleSelectors = ({ prefix, data, onChange }: { prefix: "label" | "value", data: any, onChange: (key: string, val: string) => void }) => (
  <div className="flex gap-1">
    <select 
      className={`p-1 border rounded text-[10px] w-14 ${data[`${prefix}Color`] === 'red' ? 'text-red-600 bg-red-50' : data[`${prefix}Color`] === 'blue' ? 'text-blue-600 bg-blue-50' : 'text-black bg-white'}`}
      value={data[`${prefix}Color`] || "default"} 
      onChange={(e) => onChange(`${prefix}Color`, e.target.value)}
    >
      <option value="default">黒</option><option value="red">赤</option><option value="blue">青</option>
    </select>
    <select 
      className="p-1 border rounded text-black text-[10px] w-12 bg-white" 
      value={data[`${prefix}Size`] || (prefix === "label" ? "sm" : "base")} 
      onChange={(e) => onChange(`${prefix}Size`, e.target.value)}
    >
      <option value="xs">XS</option><option value="sm">S</option><option value="base">M</option><option value="lg">L</option><option value="xl">XL</option>
    </select>
    <select 
      className="p-1 border rounded text-black text-[10px] w-12 bg-white" 
      value={data[`${prefix}Align`] || (prefix === "label" ? "left" : "right")} 
      onChange={(e) => onChange(`${prefix}Align`, e.target.value)}
    >
      <option value="left">左</option><option value="center">中</option><option value="right">右</option>
    </select>
  </div>
);

export default function AdminServicesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 新規追加用ステート
  const [newCatTitle, setNewCatTitle] = useState("");
  
  const initialItem = { title: "", subTitle: "", regularPrice: "", discountPrice: "", basePrice: 0, estimatedMinutes: 60, notes: "" };
  const [newItem, setNewItem] = useState({ categoryId: "", ...initialItem });
  
  const initialDetail = { 
    label: "", value: "",
    labelColor: "default", labelSize: "sm", labelAlign: "left",
    valueColor: "default", valueSize: "base", valueAlign: "right"
  };
  const [newDetail, setNewDetail] = useState({ itemId: "", ...initialDetail });
  
  const initialOption = { title: "", subTitle: "", regularPrice: "", price: 0, additionalMinutes: 0, discountType: "NONE", discountValue: 0, linkedItemId: "" };
  // addMethod: "manual" (手入力) or "link" (既存メニューから) をUI切り替え用に持たせる
  const [newOption, setNewOption] = useState({ itemId: "", addMethod: "manual", ...initialOption });

  // 編集用ステート
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const fetchData = async () => {
    const res = await fetch("/api/services");
    if (res.ok) setCategories(await res.json());
  };

  useEffect(() => { fetchData(); },[]);

  // --- 汎用アクション処理 ---
  const handleAction = async (method: string, body: any) => {
    setLoading(true);
    try {
      await fetch("/api/services", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      await fetchData();
    } catch (e) {
      alert("処理に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // --- 並び替え処理 ---
  const handleMove = async (index: number, direction: "up" | "down", list: any[], type: "category" | "item" | "detail") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === list.length - 1)) return;
    setLoading(true);
    const newList = [...list];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    try {
      await Promise.all(newList.map((item, idx) => {
        return fetch("/api/services", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, type, order: idx }) });
      }));
      await fetchData();
    } catch (e) { alert("並び替えに失敗しました"); } finally { setLoading(false); }
  };

  // --- 明示的にプロパティを指定して追加 ---
  const addItem = async (categoryId: string, currentItems: Item[]) => {
    if (!newItem.title) return;
    setLoading(true);
    await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: "item", 
        categoryId: categoryId,
        title: newItem.title, 
        subTitle: newItem.subTitle, 
        regularPrice: newItem.regularPrice, 
        discountPrice: newItem.discountPrice, 
        basePrice: newItem.basePrice, 
        estimatedMinutes: newItem.estimatedMinutes,
        notes: newItem.notes,
        order: currentItems.length 
      }),
    });
    setNewItem({ categoryId: "", ...initialItem });
    await fetchData();
    setLoading(false);
  };

  const addDetail = async (itemId: string, currentDetails: Detail[]) => {
    if (!newDetail.value) return;
    setLoading(true);
    await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: "detail", 
        itemId: itemId, 
        label: newDetail.label, 
        value: newDetail.value, 
        labelColor: newDetail.labelColor, 
        labelSize: newDetail.labelSize, 
        labelAlign: newDetail.labelAlign,
        valueColor: newDetail.valueColor, 
        valueSize: newDetail.valueSize, 
        valueAlign: newDetail.valueAlign,
        order: currentDetails.length
      }),
    });
    setNewDetail({ itemId: "", ...initialDetail });
    await fetchData();
    setLoading(false);
  };

  const addOption = async (itemId: string, currentOptions: Option[]) => {
    if (!newOption.title) return;
    setLoading(true);
    await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "option",
        itemId: itemId,
        title: newOption.title,
        subTitle: newOption.subTitle,
        regularPrice: newOption.regularPrice,
        price: newOption.price,
        additionalMinutes: newOption.additionalMinutes,
        discountType: newOption.discountType,
        discountValue: newOption.discountValue,
        linkedItemId: newOption.linkedItemId || null,
        order: currentOptions.length
      })
    });
    setNewOption({ itemId: "", addMethod: "manual", ...initialOption });
    await fetchData();
    setLoading(false);
  };

  // --- 編集・保存 ---
  const startEdit = (data: any, type: string) => {
    setEditingId(data.id);
    setEditData({ ...data, type });
  };

  const saveEdit = async () => {
    await handleAction("PUT", editData);
    setEditingId(null);
    setEditData({});
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black pb-40">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">サービス・料金表管理</h1>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">← 戻る</Link>
        </div>

        {loading && <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"><div className="bg-white p-4 rounded shadow font-bold">処理中...</div></div>}

        {/* 大分類追加 */}
        <div className="bg-white p-4 rounded-lg shadow mb-8 flex gap-2">
          <input type="text" placeholder="新しい大分類を追加 (例: 水回りクリーニング)" className="flex-1 p-2 border rounded text-black" value={newCatTitle} onChange={(e) => setNewCatTitle(e.target.value)} />
          <button onClick={() => { handleAction("POST", { type: "category", title: newCatTitle, order: categories.length }); setNewCatTitle(""); }} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">大分類追加</button>
        </div>

        <div className="space-y-12">
          {categories.map((cat, catIdx) => (
            <div key={cat.id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              
              {/* 大分類ヘッダー */}
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
                    <h2 className="text-xl font-bold flex-1 ml-2">{cat.title}</h2>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(cat, "category")} className="text-blue-300 text-sm hover:underline">編集</button>
                      <button onClick={() => handleAction("DELETE", { id: cat.id, type: "category" })} className="text-red-400 text-sm hover:underline">削除</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-8">
                
                {/* --- 中分類追加フォーム --- */}
                <div className="flex flex-col gap-3 mb-4 bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-inner">
                  <h3 className="text-sm font-bold text-slate-600">新規中分類（サービス）の追加</h3>
                  <div className="flex gap-2">
                    <input type="text" placeholder="タイトル (例: キッチン)" className="flex-1 p-2 border rounded text-black text-sm" value={newItem.categoryId === cat.id ? newItem.title : ""} onChange={(e) => setNewItem({ ...newItem, categoryId: cat.id, title: e.target.value })} />
                    <input type="text" placeholder="補足バッジ (例: おすすめ)" className="w-1/4 p-2 border rounded text-black text-sm" value={newItem.categoryId === cat.id ? newItem.subTitle : ""} onChange={(e) => setNewItem({ ...newItem, categoryId: cat.id, subTitle: e.target.value })} />
                  </div>
                  <div className="flex gap-2 items-center">
                    <input type="text" placeholder="表示用 通常価格 (例: 20,000円)" className="flex-1 p-2 border rounded text-black text-sm" value={newItem.categoryId === cat.id ? newItem.regularPrice : ""} onChange={(e) => setNewItem({ ...newItem, categoryId: cat.id, regularPrice: e.target.value })} />
                    <span className="text-gray-400">→</span>
                    <input type="text" placeholder="表示用 特別価格 (赤字)" className="flex-1 p-2 border rounded text-black text-sm font-bold text-red-600" value={newItem.categoryId === cat.id ? newItem.discountPrice : ""} onChange={(e) => setNewItem({ ...newItem, categoryId: cat.id, discountPrice: e.target.value })} />
                  </div>
                  <div className="flex gap-2 items-center bg-blue-50 p-2 rounded">
                    <span className="text-xs font-bold text-blue-800 w-24">予約システム用</span>
                    <input type="number" placeholder="計算単価(円)" className="w-32 p-2 border rounded text-black text-sm" value={newItem.categoryId === cat.id ? newItem.basePrice || "" : ""} onChange={(e) => setNewItem({ ...newItem, categoryId: cat.id, basePrice: parseInt(e.target.value) || 0 })} />
                    <input type="number" placeholder="作業時間(分)" className="w-32 p-2 border rounded text-black text-sm" value={newItem.categoryId === cat.id ? newItem.estimatedMinutes || "" : ""} onChange={(e) => setNewItem({ ...newItem, categoryId: cat.id, estimatedMinutes: parseInt(e.target.value) || 0 })} />
                    <button onClick={() => addItem(cat.id, cat.items)} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold ml-auto shadow-sm hover:bg-green-700">中分類追加</button>
                  </div>
                </div>

                {/* --- 中分類リスト表示 --- */}
                {cat.items.map((item, itemIdx) => (
                  <div key={item.id} className="border-2 border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-6">
                    
                    {/* 1. 中分類タイトル・価格帯・時間 (ヘッダー) */}
                    <div className="border-b border-slate-100 pb-4">
                      {editingId === item.id ? (
                        <div className="flex flex-col gap-2 w-full bg-yellow-50 p-3 rounded border border-yellow-200">
                          <div className="flex gap-2">
                            <input className="flex-1 p-2 border rounded text-black text-sm font-bold" value={editData.title} onChange={(e) => setEditData((prev:any) => ({...prev, title: e.target.value}))} placeholder="タイトル" />
                            <input className="w-1/4 p-2 border rounded text-black text-sm" value={editData.subTitle || ""} onChange={(e) => setEditData((prev:any) => ({...prev, subTitle: e.target.value}))} placeholder="補足バッジ" />
                          </div>
                          <div className="flex gap-2 items-center">
                            <input className="flex-1 p-2 border rounded text-black text-sm" value={editData.regularPrice || ""} onChange={(e) => setEditData((prev:any) => ({...prev, regularPrice: e.target.value}))} placeholder="表示用 通常価格" />
                            <span className="text-gray-400">→</span>
                            <input className="flex-1 p-2 border rounded text-black text-sm font-bold text-red-600" value={editData.discountPrice || ""} onChange={(e) => setEditData((prev:any) => ({...prev, discountPrice: e.target.value}))} placeholder="表示用 特別価格" />
                          </div>
                          <div className="flex gap-2 items-center bg-blue-50 p-2 rounded mt-1">
                            <span className="text-xs font-bold text-blue-800 w-24">予約システム用</span>
                            <input type="number" className="w-32 p-2 border rounded text-black text-sm" value={editData.basePrice || 0} onChange={(e) => setEditData((prev:any) => ({...prev, basePrice: parseInt(e.target.value) || 0}))} placeholder="計算単価(円)" />
                            <input type="number" className="w-32 p-2 border rounded text-black text-sm" value={editData.estimatedMinutes || 0} onChange={(e) => setEditData((prev:any) => ({...prev, estimatedMinutes: parseInt(e.target.value) || 0}))} placeholder="作業時間(分)" />
                            <div className="ml-auto flex gap-2">
                              <button onClick={saveEdit} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold shadow-sm">保存</button>
                              <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-4 py-2 rounded text-sm font-bold shadow-sm">中止</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 w-full">
                          <div className="flex flex-col gap-0.5 mt-1">
                            <button onClick={() => handleMove(itemIdx, "up", cat.items, "item")} className="text-xs bg-gray-100 hover:bg-gray-200 px-1.5 rounded">↑</button>
                            <button onClick={() => handleMove(itemIdx, "down", cat.items, "item")} className="text-xs bg-gray-100 hover:bg-gray-200 px-1.5 rounded">↓</button>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-800 text-lg">📄 {item.title}</h3>
                              {item.subTitle && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold">{item.subTitle}</span>}
                            </div>
                            <div className="mt-2 flex items-baseline gap-3">
                              {item.regularPrice && <span className="text-sm text-gray-400 line-through">{item.regularPrice}</span>}
                              {item.discountPrice && <span className="text-xl font-black text-red-600">{item.discountPrice}</span>}
                              <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded ml-2">作業時間目安: {item.estimatedMinutes}分</span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-1">
                            <button onClick={() => startEdit(item, "item")} className="text-blue-600 text-sm hover:underline font-bold">編集</button>
                            <button onClick={() => handleAction("DELETE", { id: item.id, type: "item" })} className="text-red-500 text-sm hover:underline font-bold">削除</button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-6">
                      
                      {/* 2. 作業内容 (Detail) */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 border-l-4 border-slate-300 pl-2">作業内容（表示用詳細項目）</h4>
                        
                        <div className="space-y-2">
                          {item.details.map((detail, detailIndex) => (
                            <div key={detail.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                              {editingId === detail.id ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <input className="w-1/4 p-1 border rounded text-black text-xs" value={editData.label || ""} onChange={(e) => setEditData((prev:any) => ({...prev, label: e.target.value}))} placeholder="ラベル" />
                                  <input className="flex-1 p-1 border rounded text-black text-xs" value={editData.value} onChange={(e) => setEditData((prev:any) => ({...prev, value: e.target.value}))} placeholder="値" />
                                  <StyleSelectors prefix="label" data={editData} onChange={(k, v) => setEditData((prev: any) => ({...prev, [k]: v}))} />
                                  <StyleSelectors prefix="value" data={editData} onChange={(k, v) => setEditData((prev: any) => ({...prev, [k]: v}))} />
                                  <button onClick={saveEdit} className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold ml-2">保存</button>
                                  <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-2 py-1 rounded text-xs font-bold">中止</button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex flex-col gap-0.5">
                                    <button onClick={() => handleMove(detailIndex, "up", item.details, "detail")} className="text-[10px] bg-gray-200 hover:bg-gray-300 px-1 rounded text-gray-600">↑</button>
                                    <button onClick={() => handleMove(detailIndex, "down", item.details, "detail")} className="text-[10px] bg-gray-200 hover:bg-gray-300 px-1 rounded text-gray-600">↓</button>
                                  </div>
                                  <span className={`w-1/4 truncate ${detail.labelColor === 'red' ? 'text-red-600' : detail.labelColor === 'blue' ? 'text-blue-600' : 'text-slate-500'} ${detail.labelSize === 'lg' ? 'text-lg font-bold' : detail.labelSize === 'xl' ? 'text-xl font-bold' : detail.labelSize === 'xs' ? 'text-xs' : 'text-sm'} text-${detail.labelAlign}`}>
                                    {detail.label}
                                  </span>
                                  <span className={`flex-1 truncate ${detail.valueColor === 'red' ? 'text-red-600' : detail.valueColor === 'blue' ? 'text-blue-600' : 'text-slate-700'} ${detail.valueSize === 'lg' ? 'text-lg font-bold' : detail.valueSize === 'xl' ? 'text-xl font-bold' : detail.valueSize === 'xs' ? 'text-xs' : 'text-sm'} text-${detail.valueAlign}`}>
                                    {detail.value}
                                  </span>
                                  <div className="flex gap-2 ml-auto">
                                    <button onClick={() => startEdit(detail, "detail")} className="text-blue-400 hover:text-blue-700">✎</button>
                                    <button onClick={() => handleAction("DELETE", { id: detail.id, type: "detail" })} className="text-red-400 hover:text-red-600 font-bold">×</button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* 作業内容 追加フォーム (1行) */}
                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded mt-2 border border-gray-200">
                          <input type="text" placeholder="ラベル" className="w-1/4 p-1 border rounded text-black text-xs" value={newDetail.itemId === item.id ? newDetail.label : ""} onChange={(e) => setNewDetail({ ...newDetail, itemId: item.id, label: e.target.value })} />
                          <input type="text" placeholder="値" className="flex-1 p-1 border rounded text-black text-xs" value={newDetail.itemId === item.id ? newDetail.value : ""} onChange={(e) => setNewDetail({ ...newDetail, itemId: item.id, value: e.target.value })} />
                          <StyleSelectors prefix="label" data={newDetail.itemId === item.id ? newDetail : initialDetail} onChange={(k, v) => setNewDetail({ ...newDetail, itemId: item.id, [k]: v })} />
                          <StyleSelectors prefix="value" data={newDetail.itemId === item.id ? newDetail : initialDetail} onChange={(k, v) => setNewDetail({ ...newDetail, itemId: item.id,[k]: v })} />
                          <button onClick={() => { handleAction("POST", { type: "detail", itemId: item.id, label: newDetail.label, value: newDetail.value, labelColor: newDetail.labelColor, labelSize: newDetail.labelSize, labelAlign: newDetail.labelAlign, valueColor: newDetail.valueColor, valueSize: newDetail.valueSize, valueAlign: newDetail.valueAlign, order: item.details.length }); setNewDetail({ itemId: "", ...initialDetail }); }} className="bg-slate-600 text-white px-3 py-1 rounded text-xs font-bold ml-2">追加</button>
                        </div>
                      </div>

                      {/* 3. オプション (既存メニュー引用・割引設定対応) */}
                      <div>
                        <h4 className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-3 border-l-4 border-orange-300 pl-2">予約オプション・セット追加</h4>
                        <div className="space-y-2 mb-3">
                          {item.options?.map((opt) => (
                            <div key={opt.id} className="flex flex-col bg-orange-50 p-3 rounded-lg border border-orange-100 text-sm shadow-sm">
                              {editingId === opt.id ? (
                                <div className="flex flex-col gap-2">
                                  <div className="flex gap-2">
                                    <input className="flex-1 p-1 border rounded text-black text-xs" value={editData.title} onChange={(e) => setEditData((prev:any) => ({...prev, title: e.target.value}))} placeholder="オプション名" />
                                    <input className="w-1/4 p-1 border rounded text-black text-xs" value={editData.subTitle || ""} onChange={(e) => setEditData((prev:any) => ({...prev, subTitle: e.target.value}))} placeholder="補足" />
                                  </div>
                                  <div className="flex gap-2 items-center flex-wrap">
                                    <span className="text-[10px] font-bold text-orange-800">計算値:</span>
                                    <input type="number" className="w-20 p-1 border rounded text-black text-xs" value={editData.price || 0} onChange={(e) => setEditData((prev:any) => ({...prev, price: parseInt(e.target.value) || 0}))} placeholder="価格(円)" disabled={!!editData.linkedItemId} />
                                    <input type="number" className="w-16 p-1 border rounded text-black text-xs" value={editData.additionalMinutes || 0} onChange={(e) => setEditData((prev:any) => ({...prev, additionalMinutes: parseInt(e.target.value) || 0}))} placeholder="分" disabled={!!editData.linkedItemId} />
                                    
                                    <span className="text-[10px] font-bold text-orange-800 ml-2">割引:</span>
                                    <select className="p-1 border rounded text-xs text-black" value={editData.discountType || "NONE"} onChange={(e) => setEditData((prev:any) => ({...prev, discountType: e.target.value}))}>
                                      <option value="NONE">なし</option><option value="PERCENT">%割引</option><option value="AMOUNT">円引</option>
                                    </select>
                                    {(editData.discountType === "PERCENT" || editData.discountType === "AMOUNT") && (
                                      <input type="number" className="w-16 p-1 border rounded text-black text-xs" value={editData.discountValue || 0} onChange={(e) => setEditData((prev:any) => ({...prev, discountValue: parseInt(e.target.value) || 0}))} placeholder="値" />
                                    )}
                                    
                                    <div className="ml-auto flex gap-1">
                                      <button onClick={saveEdit} className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold">保存</button>
                                      <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-2 py-1 rounded text-[10px] font-bold">中止</button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-between items-start mb-1">
                                    <div className="flex-1">
                                      <span className="font-bold text-orange-900">{opt.title}</span>
                                      {opt.subTitle && <span className="text-xs text-slate-500 ml-2">({opt.subTitle})</span>}
                                      {opt.linkedItemId && <span className="text-[10px] bg-indigo-100 text-indigo-700 ml-2 px-1 rounded">🔗リンク</span>}
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => startEdit(opt, "option")} className="text-blue-500 text-xs hover:underline">編集</button>
                                      <button onClick={() => handleAction("DELETE", { id: opt.id, type: "option" })} className="text-red-500 text-xs hover:underline font-bold">削除</button>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-end gap-3 text-sm">
                                    {opt.discountType !== "NONE" && (
                                      <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">
                                        {opt.discountType === "PERCENT" ? `${opt.discountValue}% OFF対象` : `${opt.discountValue}円 引対象`}
                                      </span>
                                    )}
                                    {opt.regularPrice && <span className="text-xs text-slate-400 line-through">{opt.regularPrice}</span>}
                                    <span className="font-bold text-orange-600">+{opt.price.toLocaleString()}円</span>
                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold">+{opt.additionalMinutes}分</span>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* オプション追加フォーム */}
                        <div className="flex flex-col gap-2 bg-orange-50/50 p-3 rounded-lg border border-orange-200">
                          <div className="flex gap-2 items-center mb-1">
                            <span className="text-xs font-bold text-orange-800">追加方法:</span>
                            <select 
                              className="p-1 border rounded text-xs bg-white text-black"
                              value={newOption.itemId === item.id ? newOption.addMethod : "manual"}
                              onChange={(e) => {
                                if (e.target.value === "manual") {
                                  setNewOption({ ...newOption, itemId: item.id, addMethod: "manual", linkedItemId: "" });
                                } else {
                                  // リンク時は入力値をリセット
                                  setNewOption({ ...newOption, itemId: item.id, addMethod: "link", title: "", price: 0, additionalMinutes: 0 });
                                }
                              }}
                            >
                              <option value="manual">手入力で作成</option>
                              <option value="link">既存メニューから引っ張る</option>
                            </select>
                          </div>

                          <div className="flex gap-2">
                            {newOption.itemId === item.id && newOption.addMethod === "link" ? (
                              <select 
                                className="flex-1 p-2 border rounded text-xs text-black"
                                value={newOption.linkedItemId || ""}
                                onChange={(e) => {
                                  const selectedLinkItem = categories.flatMap(c => c.items).find(i => i.id === e.target.value);
                                  setNewOption({ 
                                    ...newOption, 
                                    itemId: item.id, 
                                    linkedItemId: e.target.value,
                                    title: selectedLinkItem ? selectedLinkItem.title : "",
                                    price: selectedLinkItem ? selectedLinkItem.basePrice : 0,
                                    additionalMinutes: selectedLinkItem ? selectedLinkItem.estimatedMinutes : 0
                                  });
                                }}
                              >
                                <option value="">-- 追加するメニューを選択 --</option>
                                {categories.flatMap(c => c.items).filter(i => i.id !== item.id).map(i => (
                                  <option key={i.id} value={i.id}>{i.title} ({i.basePrice}円 / {i.estimatedMinutes}分)</option>
                                ))}
                              </select>
                            ) : (
                              <input type="text" placeholder="オプション名" className="flex-1 p-2 border rounded text-xs text-black" value={newOption.itemId === item.id ? newOption.title : ""} onChange={(e) => setNewOption({ ...newOption, itemId: item.id, title: e.target.value })} />
                            )}
                            <input type="text" placeholder="補足(例:セットでお得)" className="w-1/3 p-2 border rounded text-xs text-black" value={newOption.itemId === item.id ? newOption.subTitle || "" : ""} onChange={(e) => setNewOption({ ...newOption, itemId: item.id, subTitle: e.target.value })} />
                          </div>

                          <div className="flex gap-2 items-center flex-wrap">
                            <span className="text-xs text-slate-500">計算値:</span>
                            <input type="number" placeholder="円" className="w-20 p-2 border rounded text-xs text-black" value={newOption.itemId === item.id ? newOption.price || "" : ""} onChange={(e) => setNewOption({ ...newOption, itemId: item.id, price: parseInt(e.target.value) || 0 })} disabled={newOption.addMethod === "link"} />
                            <input type="number" placeholder="分" className="w-16 p-2 border rounded text-xs text-black" value={newOption.itemId === item.id ? newOption.additionalMinutes || "" : ""} onChange={(e) => setNewOption({ ...newOption, itemId: item.id, additionalMinutes: parseInt(e.target.value) || 0 })} disabled={newOption.addMethod === "link"} />
                            
                            <span className="text-[10px] font-bold text-orange-800 ml-2">割引:</span>
                            <select className="p-2 border rounded text-xs text-black" value={newOption.itemId === item.id ? newOption.discountType : "NONE"} onChange={(e) => setNewOption({ ...newOption, itemId: item.id, discountType: e.target.value })}>
                              <option value="NONE">なし</option><option value="PERCENT">%割引</option><option value="AMOUNT">円引</option>
                            </select>
                            {(newOption.itemId === item.id && newOption.discountType !== "NONE") && (
                              <input type="number" placeholder="値" className="w-16 p-2 border rounded text-xs text-black" value={newOption.itemId === item.id ? newOption.discountValue || "" : ""} onChange={(e) => setNewOption({ ...newOption, itemId: item.id, discountValue: parseInt(e.target.value) || 0 })} />
                            )}
                            
                            <button onClick={() => { handleAction("POST", { type: "option", itemId: item.id, title: newOption.title, subTitle: newOption.subTitle, price: newOption.price, additionalMinutes: newOption.additionalMinutes, discountType: newOption.discountType, discountValue: newOption.discountValue, linkedItemId: newOption.linkedItemId || null }); setNewOption({ itemId: "", addMethod: "manual", ...initialOption }); }} className="bg-orange-500 text-white px-4 py-2 rounded text-xs font-bold shadow-sm hover:bg-orange-600 ml-auto">
                              追加
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 4. 注意事項 */}
                      <div>
                        <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-2 border-l-4 border-red-300 pl-2">注意事項欄</h4>
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                          {editingId === item.id ? (
                            <div className="flex flex-col gap-2">
                              <textarea className="w-full p-2 border rounded text-sm text-black" rows={4} value={editData.notes || ""} onChange={(e) => setEditData((prev:any) => ({...prev, notes: e.target.value}))} placeholder="注意事項を入力してください" />
                              <div className="flex justify-end gap-2">
                                <button onClick={saveEdit} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold">保存</button>
                                <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-4 py-2 rounded text-sm font-bold">中止</button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {item.notes ? item.notes : <span className="text-slate-400 italic">未入力</span>}
                            </p>
                          )}
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