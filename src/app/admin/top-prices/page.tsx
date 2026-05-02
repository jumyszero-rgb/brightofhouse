// @/src/app/admin/top-prices/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Item = {
  id: string;
  title: string;
  price: string;
  unit: string;
  order: number;
  isActive: boolean;
};

export default function TopPricesAdmin() {
  const [items, setItems] = useState<Item[]>([]);
  const [editItem, setEditItem] = useState<Partial<Item> | null>(null);

  const fetchItems = async () => {
    const res = await fetch("/api/top-prices");
    if (res.ok) setItems(await res.json());
  };

  useEffect(() => { fetchItems(); }, []);

  const save = async () => {
    if (!editItem?.title || !editItem?.price) return alert("項目名と価格を入力してください");
    const method = editItem.id ? "PUT" : "POST";
    const res = await fetch("/api/top-prices", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editItem),
    });
    if (res.ok) {
      setEditItem(null);
      fetchItems();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("削除しますか？")) return;
    await fetch("/api/top-prices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchItems();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const arr = [...items];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    for (let i = 0; i < arr.length; i++) {
      await fetch("/api/top-prices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: arr[i].id, order: i }),
      });
    }
    fetchItems();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">トップ価格アピール管理</h1>
          <div className="flex gap-2">
            <Link href="/admin" className="bg-gray-500 text-white px-4 py-2 rounded">メニュー戻る</Link>
            <button onClick={() => setEditItem({ title: "", price: "", unit: "円〜(税込)", order: items.length, isActive: true })} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">＋ 追加</button>
          </div>
        </div>

        {editItem && (
          <div className="bg-white p-6 rounded-xl shadow mb-6 space-y-4">
            <h2 className="font-bold text-lg">{editItem.id ? "編集" : "新規追加"}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">項目名</label>
                <input value={editItem.title || ""} onChange={e => setEditItem({ ...editItem, title: e.target.value })} placeholder="例: 浴室クリーニング" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">価格</label>
                <input value={editItem.price || ""} onChange={e => setEditItem({ ...editItem, price: e.target.value })} placeholder="例: 9,800" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">単位</label>
                <input value={editItem.unit || ""} onChange={e => setEditItem({ ...editItem, unit: e.target.value })} className="w-full p-2 border rounded" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editItem.isActive ?? true} onChange={e => setEditItem({ ...editItem, isActive: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm font-bold">表示する</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={save} className="bg-blue-600 text-white px-6 py-2 rounded font-bold">保存</button>
              <button onClick={() => setEditItem(null)} className="bg-gray-300 px-6 py-2 rounded font-bold">キャンセル</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.id} className={`flex items-center justify-between bg-white p-4 rounded-lg border ${item.isActive ? "" : "opacity-50"}`}>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <button onClick={() => move(idx, -1)} disabled={idx === 0} className="text-xs px-1 bg-slate-200 rounded disabled:opacity-30">▲</button>
                  <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="text-xs px-1 bg-slate-200 rounded disabled:opacity-30">▼</button>
                </div>
                <div>
                  <span className="font-bold">{item.title}</span>
                  <span className="text-blue-600 font-black text-xl ml-3">{item.price}</span>
                  <span className="text-sm text-slate-500 ml-1">{item.unit}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditItem(item)} className="text-blue-600 text-sm font-bold hover:underline">編集</button>
                <button onClick={() => remove(item.id)} className="text-red-500 text-sm font-bold hover:underline">削除</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-center text-gray-400 py-8">まだ項目がありません</p>}
        </div>
      </div>
    </div>
  );
}
