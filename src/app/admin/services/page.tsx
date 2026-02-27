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
type Item = { 
  id: string; title: string; subTitle: string; 
  regularPrice: string; discountPrice: string; 
  order: number; details: Detail[] 
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
  const [loading, setLoading] = useState(false);
  
  const [newCatTitle, setNewCatTitle] = useState("");
  // 入力用StateからID関連の初期値を削除して重複を防ぐ
  const [newItem, setNewItem] = useState({ title: "", subTitle: "", regularPrice: "", discountPrice: "" });
  const initialDetail = { 
    label: "", value: "", isPrice: false, isNote: false,
    labelColor: "default", labelSize: "sm", labelAlign: "left",
    valueColor: "default", valueSize: "base", valueAlign: "right"
  };
  const [newDetail, setNewDetail] = useState(initialDetail);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const fetchData = async () => {
    const res = await fetch("/api/services");
    if (res.ok) setCategories(await res.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 並び替え ---
  const handleMove = async (index: number, direction: "up" | "down", list: any[], type: "category" | "item" | "detail") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === list.length - 1) return;
    setLoading(true);
    const newList = [...list];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    try {
      await Promise.all(newList.map((item, idx) => {
        return fetch("/api/services", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...item, type, order: idx }),
        });
      }));
      await fetchData();
    } catch (e) { alert("失敗"); } finally { setLoading(false); }
  };

  // --- 追加処理 ---
  const addCategory = async () => {
    if (!newCatTitle) return;
    setLoading(true);
    await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", title: newCatTitle, order: categories.length }),
    });
    setNewCatTitle("");
    await fetchData();
    setLoading(false);
  };

  const addItem = async (categoryId: string, currentItems: Item[]) => {
    if (!newItem.title) return;
    setLoading(true);
    await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: "item", 
        categoryId, // ここで明示的に指定
        ...newItem, // newItemの中にはcategoryIdは含まれない
        order: currentItems.length 
      }),
    });
    setNewItem({ title: "", subTitle: "", regularPrice: "", discountPrice: "" });
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
        itemId, // ここで明示的に指定
        ...newDetail, // newDetailの中にはitemIdは含まれない
        order: currentDetails.length 
      }),
    });
    setNewDetail(initialDetail);
    await fetchData();
    setLoading(false);
  };

  // --- 削除・編集・保存 ---
  const handleDelete = async (id: string, type: "category" | "item" | "detail") => {
    if (!confirm("削除しますか？")) return;
    setLoading(true);
    await fetch("/api/services", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type }),
    });
    await fetchData();
    setLoading(false);
  };

  const startEdit = (data: any, type: "category" | "item" | "detail") => {
    setEditingId(data.id);
    setEditData({ ...data, type });
  };

  const saveEdit = async () => {
    setLoading(true);
    await fetch("/api/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    setEditingId(null);
    setEditData({});
    await fetchData();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">サービス・料金表管理</h1>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">← 戻る</Link>
        </div>

        {loading && <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"><div className="bg-white p-4 rounded shadow font-bold">処理中...</div></div>}

        <div className="bg-white p-4 rounded-lg shadow mb-8 flex gap-2">
          <input type="text" placeholder="新しい大分類" className="flex-1 p-2 border rounded text-black" value={newCatTitle} onChange={(e) => setNewCatTitle(e.target.value)} />
          <button onClick={addCategory} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">大分類追加</button>
        </div>

        <div className="space-y-8">
          {categories.map((cat, catIndex) => (
            <div key={cat.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
              <div className="bg-slate-100 p-4 flex justify-between items-center border-b border-slate-200">
                {editingId === cat.id ? (
                  <div className="flex gap-2 flex-1">
                    <input className="flex-1 p-1 border rounded text-black" value={editData.title} onChange={(e) => setEditData((prev:any) => ({...prev, title: e.target.value}))} />
                    <button onClick={saveEdit} className="bg-green-600 text-white px-3 rounded text-sm font-bold">保存</button>
                    <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-3 rounded text-sm font-bold">中止</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => handleMove(catIndex, "up", categories, "category")} className="text-xs bg-gray-200 hover:bg-gray-300 px-2 rounded">↑</button>
                      <button onClick={() => handleMove(catIndex, "down", categories, "category")} className="text-xs bg-gray-200 hover:bg-gray-300 px-2 rounded">↓</button>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 flex-1">📂 {cat.title}</h2>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(cat, "category")} className="text-blue-600 text-sm hover:underline">編集</button>
                      <button onClick={() => handleDelete(cat.id, "category")} className="text-red-500 text-sm hover:underline">削除</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-6">
                <div className="flex flex-col gap-2 mb-4 bg-slate-50 p-3 rounded border border-slate-200">
                  <div className="flex gap-2">
                    <input type="text" placeholder="中分類タイトル" className="flex-1 p-2 border rounded text-black text-sm" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} />
                    <input type="text" placeholder="補足" className="w-1/3 p-2 border rounded text-black text-sm" value={newItem.subTitle} onChange={(e) => setNewItem({ ...newItem, subTitle: e.target.value })} />
                  </div>
                  <div className="flex gap-2 items-center">
                    <input type="text" placeholder="通常価格" className="w-1/3 p-2 border rounded text-black text-sm" value={newItem.regularPrice} onChange={(e) => setNewItem({ ...newItem, regularPrice: e.target.value })} />
                    <span className="text-gray-400">→</span>
                    <input type="text" placeholder="特別特価 (赤字)" className="w-1/3 p-2 border rounded text-black text-sm font-bold text-red-600" value={newItem.discountPrice} onChange={(e) => setNewItem({ ...newItem, discountPrice: e.target.value })} />
                    <button onClick={() => addItem(cat.id, cat.items)} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold ml-auto">中分類追加</button>
                  </div>
                </div>

                {cat.items.map((item, itemIndex) => (
                  <div key={item.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                      {editingId === item.id ? (
                        <div className="flex flex-col gap-2 flex-1 bg-yellow-50 p-2 rounded">
                          <div className="flex gap-2">
                            <input className="flex-1 p-1 border rounded text-black text-sm font-bold" value={editData.title} onChange={(e) => setEditData((prev:any) => ({...prev, title: e.target.value}))} />
                            <input className="w-1/3 p-1 border rounded text-black text-sm" value={editData.subTitle || ""} onChange={(e) => setEditData((prev:any) => ({...prev, subTitle: e.target.value}))} />
                          </div>
                          <div className="flex gap-2 items-center">
                            <input className="w-1/3 p-1 border rounded text-black text-sm" value={editData.regularPrice || ""} onChange={(e) => setEditData((prev:any) => ({...prev, regularPrice: e.target.value}))} placeholder="通常価格" />
                            <span>→</span>
                            <input className="w-1/3 p-1 border rounded text-black text-sm font-bold text-red-600" value={editData.discountPrice || ""} onChange={(e) => setEditData((prev:any) => ({...prev, discountPrice: e.target.value}))} placeholder="特別特価" />
                            <div className="ml-auto flex gap-2">
                              <button onClick={saveEdit} className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">保存</button>
                              <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-2 py-1 rounded text-xs font-bold">中止</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex flex-col gap-0.5">
                            <button onClick={() => handleMove(itemIndex, "up", cat.items, "item")} className="text-xs bg-gray-100 hover:bg-gray-200 px-1.5 rounded">↑</button>
                            <button onClick={() => handleMove(itemIndex, "down", cat.items, "item")} className="text-xs bg-gray-100 hover:bg-gray-200 px-1.5 rounded">↓</button>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-700">📄 {item.title} {item.subTitle && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">{item.subTitle}</span>}</h3>
                            {(item.regularPrice || item.discountPrice) && (
                              <div className="text-sm mt-1 flex items-center gap-2">
                                {item.regularPrice && <span className="text-gray-400 line-through text-xs">{item.regularPrice}</span>}
                                {item.discountPrice && <span className="text-red-600 font-bold">{item.discountPrice}</span>}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(item, "item")} className="text-blue-500 text-xs hover:underline">編集</button>
                            <button onClick={() => handleDelete(item.id, "item")} className="text-red-500 text-xs hover:underline">削除</button>
                          </div>
                        </div>
                      )}
                    </div>

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
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-gray-500">左:</span>
                                      <StyleSelectors prefix="label" data={editData} onChange={(k, v) => setEditData((prev: any) => ({...prev, [k]: v}))} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-gray-500">右:</span>
                                      <StyleSelectors prefix="value" data={editData} onChange={(k, v) => setEditData((prev: any) => ({...prev, [k]: v}))} />
                                    </div>
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
                                <td className="py-1 text-right w-16 align-top">
                                  <button onClick={() => startEdit(detail, "detail")} className="text-blue-400 hover:text-blue-600 mr-2">✎</button>
                                  <button onClick={() => handleDelete(detail.id, "detail")} className="text-red-400 hover:text-red-600">×</button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="bg-gray-50 p-2 rounded">
                      <div className="flex gap-2 mb-2">
                        <input type="text" placeholder="ラベル" className="w-1/3 p-1 border rounded text-black text-xs" value={newDetail.label} onChange={(e) => setNewDetail({ ...newDetail, label: e.target.value })} />
                        <input type="text" placeholder="値" className="flex-1 p-1 border rounded text-black text-xs" value={newDetail.value} onChange={(e) => setNewDetail({ ...newDetail, value: e.target.value })} />
                      </div>
                      <div className="flex gap-4 items-center flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500">左:</span>
                          <StyleSelectors prefix="label" data={newDetail} onChange={(k, v) => setNewDetail({ ...newDetail, [k]: v })} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500">右:</span>
                          <StyleSelectors prefix="value" data={newDetail} onChange={(k, v) => setNewDetail({ ...newDetail, [k]: v })} />
                        </div>
                        <button onClick={() => addDetail(item.id, item.details)} className="bg-slate-600 text-white px-3 py-1 rounded text-xs ml-auto font-bold">追加</button>
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