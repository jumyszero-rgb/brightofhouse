// @/src/app/admin/service-items/page.tsx
// 「連動するサービス項目（旧・料金表）」の見出し管理に特化した軽量admin。
// ここで作る大分類(ServiceCategory)・サービス項目(ServiceItem)が、
// /service（サービス一覧）の見出しになり、サービス詳細ページの「連動するサービス項目」の選択肢にもなる。
// 価格・詳細の細かい編集は従来の「サービス・料金表管理」(/admin/services)で行う（ここでは消さないよう既存値を保持して更新する）。
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Item = { id: string; title: string; subTitle?: string | null; order: number; [k: string]: any };
type Category = { id: string; title: string; order: number; items: Item[] };

export default function ServiceItemsAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCatTitle, setNewCatTitle] = useState("");
  const [newItem, setNewItem] = useState<{ categoryId: string; title: string; subTitle: string }>({ categoryId: "", title: "", subTitle: "" });
  const [editing, setEditing] = useState<{ id: string; type: "category" | "item"; title: string; subTitle: string; src?: any } | null>(null);

  const fetchData = async () => {
    const r = await fetch("/api/services");
    if (r.ok) setCategories(await r.json());
  };
  useEffect(() => { fetchData(); }, []);

  const call = async (method: string, body: any) => {
    setLoading(true);
    try {
      await fetch("/api/services", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      await fetchData();
    } finally { setLoading(false); }
  };

  // 並べ替え（隣とorderを入れ替え）。itemは価格を消さないよう既存値ごと送る。
  const move = async (list: any[], idx: number, dir: "up" | "down", type: "category" | "item") => {
    const j = dir === "up" ? idx - 1 : idx + 1;
    if (j < 0 || j >= list.length) return;
    const a = list[idx], b = list[j];
    setLoading(true);
    try {
      await Promise.all([
        fetch("/api/services", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...a, type, order: j }) }),
        fetch("/api/services", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...b, type, order: idx }) }),
      ]);
      await fetchData();
    } finally { setLoading(false); }
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (editing.type === "category") {
      await call("PUT", { id: editing.id, type: "category", title: editing.title, order: editing.src?.order ?? 0 });
    } else {
      // itemは既存の価格等を保持したままタイトル・バッジだけ更新
      await call("PUT", { ...editing.src, type: "item", title: editing.title, subTitle: editing.subTitle });
    }
    setEditing(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8 text-black">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">サービス項目（一覧の見出し）管理</h1>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">← 戻る</Link>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
          ここで作る「大分類」と「サービス項目」が、<strong>サービス一覧（/service）の見出し</strong>になり、サービス詳細ページの「連動するサービス項目」の選択肢にもなります。価格や詳細の細かい編集は
          <Link href="/admin/services" className="underline font-bold mx-1">サービス・料金表管理</Link>
          で行えます（ここでの編集は価格を消しません）。
        </div>

        {loading && <div className="fixed inset-0 bg-black/10 z-50 flex items-center justify-center"><div className="bg-white px-4 py-2 rounded shadow font-bold">処理中...</div></div>}

        {/* 大分類追加 */}
        <div className="bg-white rounded-xl shadow p-4 mb-6 flex gap-2">
          <input value={newCatTitle} onChange={e => setNewCatTitle(e.target.value)} placeholder="新しい大分類（例：水回りクリーニング）" className="flex-1 p-2 border rounded text-sm" />
          <button
            onClick={() => { if (newCatTitle.trim()) { call("POST", { type: "category", title: newCatTitle.trim(), order: categories.length }); setNewCatTitle(""); } }}
            className="bg-blue-600 text-white px-5 py-2 rounded font-bold text-sm hover:bg-blue-700 whitespace-nowrap"
          >＋ 大分類を追加</button>
        </div>

        <div className="space-y-4">
          {categories.map((cat, catIdx) => (
            <div key={cat.id} className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
              {/* 大分類ヘッダ */}
              <div className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => move(categories, catIdx, "up", "category")} className="px-2 bg-white/10 rounded hover:bg-white/20 text-xs leading-none py-0.5">↑</button>
                  <button onClick={() => move(categories, catIdx, "down", "category")} className="px-2 bg-white/10 rounded hover:bg-white/20 text-xs leading-none py-0.5">↓</button>
                </div>
                {editing?.type === "category" && editing.id === cat.id ? (
                  <>
                    <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} className="flex-1 p-1 rounded text-black text-sm" />
                    <button onClick={saveEdit} className="bg-green-500 px-3 py-1 rounded text-xs font-bold">保存</button>
                    <button onClick={() => setEditing(null)} className="bg-gray-500 px-3 py-1 rounded text-xs font-bold">中止</button>
                  </>
                ) : (
                  <>
                    <h2 className="flex-1 font-bold">📂 {cat.title}</h2>
                    <button onClick={() => setEditing({ id: cat.id, type: "category", title: cat.title, subTitle: "", src: cat })} className="text-blue-300 text-xs hover:underline">改名</button>
                    <button onClick={() => { if (confirm(`「${cat.title}」を削除しますか？\n配下のサービス項目も削除されます。`)) call("DELETE", { id: cat.id, type: "category" }); }} className="text-red-300 text-xs hover:underline">削除</button>
                  </>
                )}
              </div>

              {/* サービス項目一覧 */}
              <div className="p-3 space-y-2">
                {cat.items.length === 0 && <p className="text-xs text-slate-400 px-1">まだサービス項目がありません。</p>}
                {cat.items.map((item, itemIdx) => (
                  <div key={item.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => move(cat.items, itemIdx, "up", "item")} className="text-[10px] bg-white border rounded px-1 hover:bg-gray-100">↑</button>
                      <button onClick={() => move(cat.items, itemIdx, "down", "item")} className="text-[10px] bg-white border rounded px-1 hover:bg-gray-100">↓</button>
                    </div>
                    {editing?.type === "item" && editing.id === item.id ? (
                      <>
                        <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="項目名" className="flex-1 p-1.5 border rounded text-sm" />
                        <input value={editing.subTitle} onChange={e => setEditing({ ...editing, subTitle: e.target.value })} placeholder="補足バッジ(任意)" className="w-32 p-1.5 border rounded text-sm" />
                        <button onClick={saveEdit} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">保存</button>
                        <button onClick={() => setEditing(null)} className="bg-gray-400 text-white px-3 py-1 rounded text-xs font-bold">中止</button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-sm text-slate-800">{item.title}</span>
                          {item.subTitle && <span className="ml-2 text-[11px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{item.subTitle}</span>}
                        </div>
                        <button onClick={() => setEditing({ id: item.id, type: "item", title: item.title, subTitle: item.subTitle || "", src: item })} className="text-blue-600 text-xs hover:underline">編集</button>
                        <button onClick={() => { if (confirm(`サービス項目「${item.title}」を削除しますか？`)) call("DELETE", { id: item.id, type: "item" }); }} className="text-red-500 text-xs hover:underline">削除</button>
                      </>
                    )}
                  </div>
                ))}

                {/* サービス項目追加 */}
                <div className="flex gap-2 pt-1">
                  <input
                    value={newItem.categoryId === cat.id ? newItem.title : ""}
                    onChange={e => setNewItem({ categoryId: cat.id, title: e.target.value, subTitle: newItem.categoryId === cat.id ? newItem.subTitle : "" })}
                    placeholder="サービス項目名（例：キッチンクリーニング）"
                    className="flex-1 p-2 border rounded text-sm"
                  />
                  <input
                    value={newItem.categoryId === cat.id ? newItem.subTitle : ""}
                    onChange={e => setNewItem({ categoryId: cat.id, title: newItem.categoryId === cat.id ? newItem.title : "", subTitle: e.target.value })}
                    placeholder="補足バッジ(任意)"
                    className="w-32 p-2 border rounded text-sm"
                  />
                  <button
                    onClick={() => {
                      if (newItem.categoryId === cat.id && newItem.title.trim()) {
                        call("POST", { type: "item", categoryId: cat.id, title: newItem.title.trim(), subTitle: newItem.subTitle.trim() || null, order: cat.items.length });
                        setNewItem({ categoryId: "", title: "", subTitle: "" });
                      }
                    }}
                    className="bg-slate-700 text-white px-4 py-2 rounded text-sm font-bold hover:bg-slate-800 whitespace-nowrap"
                  >＋ 項目追加</button>
                </div>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">まず大分類を追加してください。</div>
          )}
        </div>
      </div>
    </div>
  );
}
