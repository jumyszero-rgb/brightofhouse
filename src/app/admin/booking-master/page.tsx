// @/src/app/admin/booking-master/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// --- 型定義 ---
type BookingOption = { id: string; title: string; price: number; durationMin: number; order: number; subMenuId: string };
type BookingSubMenu = { id: string; title: string; price: number; durationMin: number; order: number; menuId: string; options: BookingOption[] };
type BookingMenu = { id: string; title: string; basePrice: number; priceNote: string | null; basicItems: string | null; notes: string | null; durationMin: number; order: number; categoryId: string; subMenus: BookingSubMenu[] };
type BookingCategory = { id: string; title: string; order: number; menus: BookingMenu[] };

export default function AdminBookingMasterPage() {
  const [categories, setCategories] = useState<BookingCategory[]>([]);
  const [loading, setLoading] = useState(false);

  // 新規追加用ステート
  const [newCatTitle, setNewCatTitle] = useState("");
  const [newMenu, setNewMenu] = useState({ categoryId: "", title: "", basePrice: 0, priceNote: "", basicItems: "", notes: "", durationMin: 60 });
  const [newSubMenu, setNewSubMenu] = useState({ menuId: "", title: "", price: 0, durationMin: 0 });
  const[newOption, setNewOption] = useState({ subMenuId: "", title: "", price: 0, durationMin: 0 });

  // 編集用ステート
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

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
                      <input type="number" placeholder="時間(分)" className="w-24 p-2 border rounded text-black text-sm" value={newMenu.categoryId === cat.id ? newMenu.durationMin || "" : ""} onChange={(e) => setNewMenu({ ...newMenu, categoryId: cat.id, durationMin: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <textarea placeholder="基本作業内容 (改行で箇条書き)" rows={3} className="w-full p-2 border rounded text-black text-sm" value={newMenu.categoryId === cat.id ? newMenu.basicItems : ""} onChange={(e) => setNewMenu({ ...newMenu, categoryId: cat.id, basicItems: e.target.value })} />
                  <textarea placeholder="注意事項 (任意)" rows={2} className="w-full p-2 border rounded text-black text-sm" value={newMenu.categoryId === cat.id ? newMenu.notes : ""} onChange={(e) => setNewMenu({ ...newMenu, categoryId: cat.id, notes: e.target.value })} />
                  <button onClick={() => { handleAction("POST", { type: "menu", categoryId: cat.id, title: newMenu.title, basePrice: newMenu.basePrice, priceNote: newMenu.priceNote, basicItems: newMenu.basicItems, notes: newMenu.notes, durationMin: newMenu.durationMin, order: cat.menus.length }); setNewMenu({ categoryId: "", title: "", basePrice: 0, priceNote: "", basicItems: "", notes: "", durationMin: 60 }); }} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold shadow-sm">中分類を追加</button>
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
                          <div className="flex gap-2 items-center">
                            <span className="text-xs font-bold text-gray-500">基本料金:</span><input type="number" className="w-24 p-1 border rounded text-black text-sm" value={editData.basePrice || 0} onChange={(e) => setEditData((prev:any) => ({...prev, basePrice: parseInt(e.target.value) || 0}))} />
                            <span className="text-xs font-bold text-gray-500">注釈:</span><input type="text" className="flex-1 p-1 border rounded text-black text-sm" value={editData.priceNote || ""} onChange={(e) => setEditData((prev:any) => ({...prev, priceNote: e.target.value}))} placeholder="(例: +3300円〜)" />
                            <span className="text-xs font-bold text-gray-500">時間(分):</span><input type="number" className="w-16 p-1 border rounded text-black text-sm" value={editData.durationMin || 0} onChange={(e) => setEditData((prev:any) => ({...prev, durationMin: parseInt(e.target.value) || 0}))} />
                          </div>
                          <textarea className="w-full p-1 border rounded text-black text-sm" rows={3} value={editData.basicItems || ""} onChange={(e) => setEditData((prev:any) => ({...prev, basicItems: e.target.value}))} placeholder="基本作業内容" />
                          <textarea className="w-full p-1 border rounded text-black text-sm" rows={2} value={editData.notes || ""} onChange={(e) => setEditData((prev:any) => ({...prev, notes: e.target.value}))} placeholder="注意事項" />
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
                            <div className="flex items-center gap-4">
                              <h3 className="font-bold text-blue-800 text-lg">📄 {menu.title}</h3>
                              <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">{menu.basePrice.toLocaleString()}円</span>
                              {menu.priceNote && <span className="text-xs text-red-600 font-bold">{menu.priceNote}</span>}
                              <span className="text-xs text-slate-500">({menu.durationMin}分)</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(menu, "menu")} className="text-blue-500 text-xs hover:underline font-bold">編集</button>
                            <button onClick={() => handleAction("DELETE", { id: menu.id, type: "menu" })} className="text-red-500 text-xs hover:underline font-bold">削除</button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pl-6 border-l-2 border-slate-100 space-y-6">
                      
                      {/* --- 基本作業内容 --- */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 border-l-4 border-slate-300 pl-2">基本作業内容</h4>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {menu.basicItems ? menu.basicItems : <span className="text-slate-400 italic">未設定</span>}
                        </div>
                      </div>
                      
                      {/* 【3階層目】小分類リスト (オプション等) */}
                      <div>
                        <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 border-l-4 border-orange-300 pl-2">オプション</h4>
                        {menu.subMenus.map((subMenu, subMenuIdx) => (
                          <div key={subMenu.id} className="bg-orange-50 border border-orange-100 rounded-lg p-4 space-y-4 mb-3">
                            <div className="flex justify-between items-center border-b border-orange-200 pb-2">
                              {editingId === subMenu.id ? (
                                <div className="flex gap-2 flex-1 items-center bg-yellow-50 p-2 rounded">
                                  <input className="flex-1 p-1 border rounded text-black text-xs font-bold" value={editData.title} onChange={(e) => setEditData((prev:any) => ({...prev, title: e.target.value}))} placeholder="小分類名" />
                                  <span className="text-xs font-bold text-gray-500">追加料金:</span><input type="number" className="w-20 p-1 border rounded text-black text-xs" value={editData.price || 0} onChange={(e) => setEditData((prev:any) => ({...prev, price: parseInt(e.target.value) || 0}))} />
                                  <span className="text-xs font-bold text-gray-500">追加時間(分):</span><input type="number" className="w-16 p-1 border rounded text-black text-xs" value={editData.durationMin || 0} onChange={(e) => setEditData((prev:any) => ({...prev, durationMin: parseInt(e.target.value) || 0}))} />
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
                                  <div className="flex-1 flex items-center gap-3">
                                    <h4 className="font-bold text-orange-900 text-sm">➖ {subMenu.title}</h4>
                                    <span className="text-xs font-bold text-orange-700 bg-white px-2 py-0.5 border rounded shadow-sm">+{subMenu.price.toLocaleString()}円 / +{subMenu.durationMin}分</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => startEdit(subMenu, "submenu")} className="text-blue-500 text-xs hover:underline">編集</button>
                                    <button onClick={() => handleAction("DELETE", { id: subMenu.id, type: "submenu" })} className="text-red-500 text-xs hover:underline">削除</button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 【4階層目】極小分類 (サブオプション) リスト */}
                            <div className="pl-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                {subMenu.options.map((opt, optIdx) => (
                                  <div key={opt.id} className="bg-white border border-orange-100 p-2 rounded flex justify-between items-center text-xs shadow-sm">
                                    {editingId === opt.id ? (
                                      <div className="flex gap-1 w-full items-center">
                                        <input className="flex-1 p-1 border rounded text-black text-[10px]" value={editData.title} onChange={(e) => setEditData((prev:any) => ({...prev, title: e.target.value}))} placeholder="極小分類名" />
                                        <input type="number" className="w-16 p-1 border rounded text-black text-[10px]" value={editData.price || 0} onChange={(e) => setEditData((prev:any) => ({...prev, price: parseInt(e.target.value) || 0}))} placeholder="円" />
                                        <input type="number" className="w-12 p-1 border rounded text-black text-[10px]" value={editData.durationMin || 0} onChange={(e) => setEditData((prev:any) => ({...prev, durationMin: parseInt(e.target.value) || 0}))} placeholder="分" />
                                        <button onClick={saveEdit} className="bg-green-600 text-white px-1.5 py-0.5 rounded">✓</button>
                                        <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-1.5 py-0.5 rounded">×</button>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-center gap-1">
                                          <button onClick={() => handleMove(optIdx, "up", subMenu.options, "option")} className="text-[8px] text-gray-400 hover:text-gray-700">▲</button>
                                          <button onClick={() => handleMove(optIdx, "down", subMenu.options, "option")} className="text-[8px] text-gray-400 hover:text-gray-700">▼</button>
                                          <span className="font-bold text-orange-900 ml-1">{opt.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-orange-600">+{opt.price.toLocaleString()}円</span>
                                          <span className="text-[10px] text-orange-600 bg-orange-100 px-1 rounded">+{opt.durationMin}分</span>
                                          <button onClick={() => startEdit(opt, "option")} className="text-blue-400 text-[10px] hover:underline ml-1">✎</button>
                                          <button onClick={() => handleAction("DELETE", { id: opt.id, type: "option" })} className="text-red-400 text-[10px] hover:underline font-bold">×</button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                              
                              {/* 極小分類追加フォーム */}
                              <div className="flex gap-2 items-center bg-white p-2 rounded border border-orange-200">
                                <input type="text" placeholder="サブオプション(極小分類)を追加" className="flex-1 p-1.5 border rounded text-black text-xs" value={newOption.subMenuId === subMenu.id ? newOption.title : ""} onChange={(e) => setNewOption({ ...newOption, subMenuId: subMenu.id, title: e.target.value })} />
                                <input type="number" placeholder="加算(円)" className="w-16 p-1.5 border rounded text-black text-xs" value={newOption.subMenuId === subMenu.id ? newOption.price || "" : ""} onChange={(e) => setNewOption({ ...newOption, subMenuId: subMenu.id, price: parseInt(e.target.value) || 0 })} />
                                <input type="number" placeholder="加算(分)" className="w-16 p-1.5 border rounded text-black text-xs" value={newOption.subMenuId === subMenu.id ? newOption.durationMin || "" : ""} onChange={(e) => setNewOption({ ...newOption, subMenuId: subMenu.id, durationMin: parseInt(e.target.value) || 0 })} />
                                <button onClick={() => { handleAction("POST", { type: "option", subMenuId: subMenu.id, title: newOption.title, price: newOption.price, durationMin: newOption.durationMin, order: subMenu.options.length }); setNewOption({ subMenuId: "", title: "", price: 0, durationMin: 0 }); }} className="bg-orange-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-orange-600">追加</button>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* 小分類追加フォーム */}
                        <div className="flex gap-2 items-center bg-white p-3 rounded border border-slate-200 mt-2 shadow-sm">
                          <input type="text" placeholder="小分類を追加 (例: 追加 浴室クリーニング)" className="flex-1 p-2 border rounded text-black text-xs" value={newSubMenu.menuId === menu.id ? newSubMenu.title : ""} onChange={(e) => setNewSubMenu({ ...newSubMenu, menuId: menu.id, title: e.target.value })} />
                          <input type="number" placeholder="加算(円)" className="w-20 p-2 border rounded text-black text-xs" value={newSubMenu.menuId === menu.id ? newSubMenu.price || "" : ""} onChange={(e) => setNewSubMenu({ ...newSubMenu, menuId: menu.id, price: parseInt(e.target.value) || 0 })} />
                          <input type="number" placeholder="加算(分)" className="w-20 p-2 border rounded text-black text-xs" value={newSubMenu.menuId === menu.id ? newSubMenu.durationMin || "" : ""} onChange={(e) => setNewSubMenu({ ...newSubMenu, menuId: menu.id, durationMin: parseInt(e.target.value) || 0 })} />
                          <button onClick={() => { handleAction("POST", { type: "submenu", menuId: menu.id, title: newSubMenu.title, price: newSubMenu.price, durationMin: newSubMenu.durationMin, order: menu.subMenus.length }); setNewSubMenu({ menuId: "", title: "", price: 0, durationMin: 0 }); }} className="bg-slate-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-slate-700">小分類追加</button>
                        </div>
                      </div>

                      {/* --- 注意事項 --- */}
                      <div>
                        <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2 border-l-4 border-red-300 pl-2">注意事項</h4>
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {menu.notes ? menu.notes : <span className="text-slate-400 italic">未入力（編集から追加できます）</span>}
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