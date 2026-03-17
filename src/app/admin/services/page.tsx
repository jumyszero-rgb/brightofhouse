// @/src/app/admin/services/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// --- 型定義 ---
type Detail = { 
  id: string; label: string; value: string; 
  isPrice: boolean; isNote: boolean; 
  labelColor: string; labelSize: string; labelAlign: string;
  valueColor: string; valueSize: string; valueAlign: string;
  order: number 
};
type Option = { 
  id: string; title: string; price: number; additionalMinutes: number 
};
type Item = { 
  id: string; title: string; subTitle: string; 
  regularPrice: string; discountPrice: string; 
  basePrice: number; estimatedMinutes: number;
  order: number; details: Detail[]; options: Option[] 
};
type Category = { id: string; title: string; order: number; items: Item[] };

// --- スタイル選択用共通コンポーネント ---
const StyleSelectors = ({ prefix, data, onChange }: { prefix: "label" | "value", data: any, onChange: (key: string, val: string) => void }) => (
  <div className="flex gap-1">
    <select 
      className={`p-1 border rounded text-xs w-16 ${data[`${prefix}Color`] === 'red' ? 'text-red-600 bg-red-50' : data[`${prefix}Color`] === 'blue' ? 'text-blue-600 bg-blue-50' : 'text-black'}`}
      value={data[`${prefix}Color`] || "default"} 
      onChange={(e) => onChange(`${prefix}Color`, e.target.value)}
    >
      <option value="default">黒</option><option value="red">赤</option><option value="blue">青</option>
    </select>
    <select 
      className="p-1 border rounded text-black text-xs w-16" 
      value={data[`${prefix}Size`] || (prefix === "label" ? "sm" : "base")} 
      onChange={(e) => onChange(`${prefix}Size`, e.target.value)}
    >
      <option value="xs">XS</option><option value="sm">S</option><option value="base">M</option><option value="lg">L</option><option value="xl">XL</option>
    </select>
    <select 
      className="p-1 border rounded text-black text-xs w-16" 
      value={data[`${prefix}Align`] || (prefix === "label" ? "left" : "right")} 
      onChange={(e) => onChange(`${prefix}Align`, e.target.value)}
    >
      <option value="left">左</option><option value="center">中</option><option value="right">右</option>
    </select>
  </div>
);

export default function AdminServicesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const[loading, setLoading] = useState(false);
  
  // 新規追加用ステート
  const[newCatTitle, setNewCatTitle] = useState("");
  
  const initialItem = { title: "", subTitle: "", regularPrice: "", discountPrice: "", basePrice: 0, estimatedMinutes: 60 };
  const [newItem, setNewItem] = useState({ categoryId: "", ...initialItem });
  
  const initialDetail = { 
    label: "", value: "", isPrice: false, isNote: false,
    labelColor: "default", labelSize: "sm", labelAlign: "left",
    valueColor: "default", valueSize: "base", valueAlign: "right"
  };
  const[newDetail, setNewDetail] = useState({ itemId: "", ...initialDetail });
  
  const initialOption = { title: "", price: 0, additionalMinutes: 0 };
  const [newOption, setNewOption] = useState({ itemId: "", ...initialOption });

  // 編集用ステート
  const [editingId, setEditingId] = useState<string | null>(null);
  const[editData, setEditData] = useState<any>({});

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

  // --- 並び替え ---
  const handleMove = async (index: number, direction: "up" | "down", list: any[], type: "category" | "item" | "detail") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === list.length - 1)) return;
    setLoading(true);
    const newList =[...list];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    try {
      await Promise.all(newList.map((item, idx) => {
        return fetch("/api/services", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, type, order: idx }) });
      }));
      await fetchData();
    } catch (e) { alert("並び替えに失敗しました"); } finally { setLoading(false); }
  };

  // --- 明示的にプロパティを指定して重複を防ぐ追加処理 ---
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
        isPrice: newDetail.isPrice, 
        isNote: newDetail.isNote,
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
          <h1 className="text-2xl font-bold text-gray-800">サービス・料金表管理（予約システム連動版）</h1>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">← 戻る</Link>
        </div>

        {loading && <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"><div className="bg-white p-4 rounded shadow font-bold">処理中...</div></div>}

        {/* 大分類追加 */}
        <div className="bg-white p-4 rounded-lg shadow mb-8 flex gap-2">
          <input type="text" placeholder="新しい大分類を追加" className="flex-1 p-2 border rounded text-black" value={newCatTitle} onChange={(e) => setNewCatTitle(e.target.value)} />
          <button onClick={() => { handleAction("POST", { type: "category", title: newCatTitle, order: categories.length }); setNewCatTitle(""); }} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">大分類追加</button>
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
                
                {/* 中分類追加フォーム */}
                <div className="flex flex-col gap-2 mb-4 bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-inner">
                  <h3 className="text-sm font-bold text-slate-600 mb-1">新規中分類（サービス）の追加</h3>
                  <div className="flex gap-2">
                    <input type="text" placeholder="中分類タイトル" className="flex-1 p-2 border rounded text-black text-sm" value={newItem.categoryId === cat.id ? newItem.title : ""} onChange={(e) => setNewItem({ ...newItem, categoryId: cat.id, title: e.target.value })} />
                    <input type="text" placeholder="補足バッジ" className="w-1/4 p-2 border rounded text-black text-sm" value={newItem.categoryId === cat.id ? newItem.subTitle : ""} onChange={(e) => setNewItem({ ...newItem, categoryId: cat.id, subTitle: e.target.value })} />
                  </div>
                  <div className="flex gap-2 items-center mt-1">
                    <input type="text" placeholder="表示用 通常価格(例:20,000円)" className="flex-1 p-2 border rounded text-black text-sm" value={newItem.categoryId === cat.id ? newItem.regularPrice : ""} onChange={(e) => setNewItem({ ...newItem, categoryId: cat.id, regularPrice: e.target.value })} />
                    <span className="text-gray-400">→</span>
                    <input type="text" placeholder="表示用 特別価格(赤字)" className="flex-1 p-2 border rounded text-black text-sm font-bold text-red-600" value={newItem.categoryId === cat.id ? newItem.discountPrice : ""} onChange={(e) => setNewItem({ ...newItem, categoryId: cat.id, discountPrice: e.target.value })} />
                  </div>
                  <div className="flex gap-2 items-center mt-1 bg-blue-50 p-2 rounded">
                    <span className="text-xs font-bold text-blue-800 w-24">予約システム用</span>
                    <input type="number" placeholder="計算単価(円)" className="w-32 p-2 border rounded text-black text-sm" value={newItem.categoryId === cat.id ? newItem.basePrice || "" : ""} onChange={(e) => setNewItem({ ...newItem, categoryId: cat.id, basePrice: parseInt(e.target.value) || 0 })} />
                    <input type="number" placeholder="作業時間(分)" className="w-32 p-2 border rounded text-black text-sm" value={newItem.categoryId === cat.id ? newItem.estimatedMinutes || "" : ""} onChange={(e) => setNewItem({ ...newItem, categoryId: cat.id, estimatedMinutes: parseInt(e.target.value) || 0 })} />
                    <button onClick={() => addItem(cat.id, cat.items)} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold ml-auto shadow-sm">中分類追加</button>
                  </div>
                </div>

                {/* 中分類リスト */}
                {cat.items.map((item, itemIdx) => (
                  <div key={item.id} className="border-2 border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                    
                    {/* 中分類ヘッダー (編集/表示) */}
                    <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
                      {editingId === item.id ? (
                        <div className="flex flex-col gap-2 flex-1 bg-yellow-50 p-3 rounded">
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
                              {item.subTitle && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">{item.subTitle}</span>}
                            </div>
                            {(item.regularPrice || item.discountPrice) && (
                              <div className="text-sm mt-1 flex items-center gap-2">
                                {item.regularPrice && <span className="text-gray-400 line-through text-xs">{item.regularPrice}</span>}
                                {item.discountPrice && <span className="text-red-600 font-bold">{item.discountPrice}</span>}
                              </div>
                            )}
                            <div className="text-xs text-blue-600 font-bold mt-1 bg-blue-50 inline-block px-2 py-1 rounded">
                              【予約計算用】 単価: {item.basePrice}円 / 目安時間: {item.estimatedMinutes}分
                            </div>
                          </div>
                          <div className="flex gap-2 mt-1">
                            <button onClick={() => startEdit(item, "item")} className="text-blue-600 text-sm hover:underline font-bold">編集</button>
                            <button onClick={() => handleAction("DELETE", { id: item.id, type: "item" })} className="text-red-500 text-sm hover:underline">削除</button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* 左側：詳細リスト (スタイル設定付き) */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">表示用 詳細項目</h4>
                        <table className="w-full text-sm mb-3">
                          <tbody>
                            {item.details.map((detail, detailIndex) => (
                              <tr key={detail.id} className="border-b border-slate-50">
                                {editingId === detail.id ? (
                                  <td colSpan={4} className="py-2 bg-yellow-50 p-2 rounded">
                                    <div className="flex flex-col gap-2">
                                      <div className="flex gap-2">
                                        <input className="w-1/3 p-1 border rounded text-black text-xs" value={editData.label || ""} onChange={(e) => setEditData((prev:any) => ({...prev, label: e.target.value}))} placeholder="ラベル" />
                                        <input className="flex-1 p-1 border rounded text-black text-xs" value={editData.value} onChange={(e) => setEditData((prev:any) => ({...prev, value: e.target.value}))} placeholder="値" />
                                      </div>
                                      <div className="flex gap-4 items-center flex-wrap">
                                        <div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-500">左:</span><StyleSelectors prefix="label" data={editData} onChange={(k, v) => setEditData((prev: any) => ({...prev, [k]: v}))} /></div>
                                        <div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-500">右:</span><StyleSelectors prefix="value" data={editData} onChange={(k, v) => setEditData((prev: any) => ({...prev, [k]: v}))} /></div>
                                        <div className="flex-1 flex justify-end gap-2">
                                          <button onClick={saveEdit} className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">保存</button>
                                          <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-2 py-1 rounded text-xs font-bold">中止</button>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                ) : (
                                  <>
                                    <td className="py-1 w-8 align-top">
                                      <div className="flex flex-col gap-0.5">
                                        <button onClick={() => handleMove(detailIndex, "up", item.details, "detail")} className="text-[10px] bg-gray-100 hover:bg-gray-200 px-1 rounded">↑</button>
                                        <button onClick={() => handleMove(detailIndex, "down", item.details, "detail")} className="text-[10px] bg-gray-100 hover:bg-gray-200 px-1 rounded">↓</button>
                                      </div>
                                    </td>
                                    <td className="py-1 w-1/3 align-top">
                                      <span className={`block ${detail.labelColor === 'red' ? 'text-red-600' : detail.labelColor === 'blue' ? 'text-blue-600' : 'text-slate-500'} ${detail.labelSize === 'lg' ? 'text-lg font-bold' : detail.labelSize === 'xl' ? 'text-xl font-bold' : detail.labelSize === 'xs' ? 'text-xs' : 'text-sm'} text-${detail.labelAlign}`}>
                                        {detail.label}
                                      </span>
                                    </td>
                                    <td className="py-1 align-top">
                                      <span className={`block ${detail.valueColor === 'red' ? 'text-red-600' : detail.valueColor === 'blue' ? 'text-blue-600' : 'text-slate-700'} ${detail.valueSize === 'lg' ? 'text-lg font-bold' : detail.valueSize === 'xl' ? 'text-xl font-bold' : detail.valueSize === 'xs' ? 'text-xs' : 'text-sm'} text-${detail.valueAlign}`}>
                                        {detail.value}
                                      </span>
                                    </td>
                                    <td className="py-1 text-right w-12 align-top">
                                      <button onClick={() => startEdit(detail, "detail")} className="text-blue-400 hover:text-blue-700 mr-2">✎</button>
                                      <button onClick={() => handleAction("DELETE", { id: detail.id, type: "detail" })} className="text-red-400 hover:text-red-600">×</button>
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {/* 詳細追加 */}
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="flex gap-2 mb-2">
                            <input type="text" placeholder="ラベル" className="w-1/3 p-1 border rounded text-black text-xs" value={newDetail.itemId === item.id ? newDetail.label : ""} onChange={(e) => setNewDetail({ ...newDetail, itemId: item.id, label: e.target.value })} />
                            <input type="text" placeholder="値" className="flex-1 p-1 border rounded text-black text-xs" value={newDetail.itemId === item.id ? newDetail.value : ""} onChange={(e) => setNewDetail({ ...newDetail, itemId: item.id, value: e.target.value })} />
                          </div>
                          <div className="flex gap-2 items-center flex-wrap">
                            <div className="flex items-center gap-1"><span className="text-[10px] font-bold text-gray-500">左:</span><StyleSelectors prefix="label" data={newDetail.itemId === item.id ? newDetail : initialDetail} onChange={(k, v) => setNewDetail({ ...newDetail, itemId: item.id, [k]: v })} /></div>
                            <div className="flex items-center gap-1"><span className="text-[10px] font-bold text-gray-500">右:</span><StyleSelectors prefix="value" data={newDetail.itemId === item.id ? newDetail : initialDetail} onChange={(k, v) => setNewDetail({ ...newDetail, itemId: item.id, [k]: v })} /></div>
                            <button onClick={() => addDetail(item.id, item.details)} className="bg-slate-600 text-white px-3 py-1 rounded text-xs font-bold ml-auto">追加</button>
                          </div>
                        </div>
                      </div>

                      {/* 右側：予約オプション */}
                      <div>
                        <h4 className="text-xs font-bold text-orange-500 uppercase mb-2">予約用 オプション追加</h4>
                        <div className="space-y-2 mb-3">
                          {item.options?.map((opt) => (
                            <div key={opt.id} className="flex justify-between items-center bg-orange-50 p-2 rounded border border-orange-100 text-sm">
                              <span className="font-bold text-orange-900">{opt.title}</span>
                              <span className="text-orange-700 text-xs">+{opt.price}円 / +{opt.additionalMinutes}分</span>
                              <button onClick={() => handleAction("DELETE", { id: opt.id, type: "option" })} className="text-red-500 font-bold ml-2">×</button>
                            </div>
                          ))}
                        </div>
                        {/* オプション追加フォーム */}
                        <div className="flex gap-1 bg-orange-50 p-2 rounded border border-orange-100">
                          <input type="text" placeholder="オプション名" className="flex-1 p-1 border rounded text-xs text-black" value={newOption.itemId === item.id ? newOption.title : ""} onChange={(e) => setNewOption({ ...newOption, itemId: item.id, title: e.target.value })} />
                          <input type="number" placeholder="円" className="w-16 p-1 border rounded text-xs text-black" value={newOption.itemId === item.id ? newOption.price || "" : ""} onChange={(e) => setNewOption({ ...newOption, itemId: item.id, price: parseInt(e.target.value) || 0 })} />
                          <input type="number" placeholder="分" className="w-12 p-1 border rounded text-xs text-black" value={newOption.itemId === item.id ? newOption.additionalMinutes || "" : ""} onChange={(e) => setNewOption({ ...newOption, itemId: item.id, additionalMinutes: parseInt(e.target.value) || 0 })} />
                          <button onClick={() => { handleAction("POST", { type: "option", itemId: item.id, title: newOption.title, price: newOption.price, additionalMinutes: newOption.additionalMinutes }); setNewOption({ itemId: "", title: "", price: 0, additionalMinutes: 0 }); }} className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">＋</button>
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