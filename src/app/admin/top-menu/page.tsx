// @/src/app/admin/top-menu/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Menu = {
  id: string;
  title: string;
  price: string;
  unit: string;
  priceNote: string;
  description: string;
  features: string;
  isPopular: boolean;
  order: number;
  link: string;
};

export default function TopMenuAdmin() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [editMenu, setEditMenu] = useState<Partial<Menu> | null>(null);
  const [servicePages, setServicePages] = useState<any[]>([]);

  const fetchMenus = async () => {
    const res = await fetch("/api/top-menu");
    if (res.ok) setMenus(await res.json());
  };

  const fetchPages = async () => {
    const res = await fetch("/api/service-pages?all=true");
    if (res.ok) setServicePages(await res.json());
  };

  useEffect(() => { fetchMenus(); fetchPages(); }, []);

  const save = async () => {
    if (!editMenu?.title || !editMenu?.price) return alert("タイトルと価格を入力してください");
    const method = editMenu.id ? "PUT" : "POST";
    const res = await fetch("/api/top-menu", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editMenu),
    });
    if (res.ok) {
      setEditMenu(null);
      fetchMenus();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("削除しますか？")) return;
    await fetch("/api/top-menu", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchMenus();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const arr = [...menus];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    for (let i = 0; i < arr.length; i++) {
      await fetch("/api/top-menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: arr[i].id, order: i }),
      });
    }
    fetchMenus();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">トップ人気メニュー管理</h1>
          <div className="flex gap-2">
            <Link href="/admin" className="bg-gray-500 text-white px-4 py-2 rounded">メニュー戻る</Link>
            <button onClick={() => setEditMenu({ title: "", price: "", unit: "円〜", priceNote: "", description: "", features: "", isPopular: false, order: menus.length, link: "/service" })} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">＋ 追加</button>
          </div>
        </div>

        {editMenu && (
          <div className="bg-white p-6 rounded-xl shadow mb-6 space-y-4">
            <h2 className="font-bold text-lg">{editMenu.id ? "編集" : "新規追加"}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">メニュー名</label>
                <input value={editMenu.title || ""} onChange={e => setEditMenu({ ...editMenu, title: e.target.value })} placeholder="例: 水回りセットプラン" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">説明文</label>
                <input value={editMenu.description || ""} onChange={e => setEditMenu({ ...editMenu, description: e.target.value })} placeholder="例: まとめてお得に" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">価格補足（例: 2点～）</label>
                <input value={editMenu.priceNote || ""} onChange={e => setEditMenu({ ...editMenu, priceNote: e.target.value })} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">価格</label>
                <input value={editMenu.price || ""} onChange={e => setEditMenu({ ...editMenu, price: e.target.value })} placeholder="例: 15,680" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">単位</label>
                <input value={editMenu.unit || ""} onChange={e => setEditMenu({ ...editMenu, unit: e.target.value })} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">リンク先</label>
                <select value={editMenu.link || "/service"} onChange={e => setEditMenu({ ...editMenu, link: e.target.value })} className="w-full p-2 border rounded bg-white">
                  <option value="/service">料金一覧（/service）</option>
                  {servicePages.map((p: any) => (
                    <option key={p.id} value={`/service/${p.slug}`}>{p.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">特徴リスト（1行1項目）</label>
              <textarea value={editMenu.features || ""} onChange={e => setEditMenu({ ...editMenu, features: e.target.value })} rows={5} placeholder={"✅ 通常価格より15％OFF\n✅ キッチン + レンジフード\n✅ 組み合わせ自由！"} className="w-full p-2 border rounded text-sm" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editMenu.isPopular ?? false} onChange={e => setEditMenu({ ...editMenu, isPopular: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm font-bold">「人気 No.1」バッジを表示</span>
            </label>
            <div className="flex gap-2">
              <button onClick={save} className="bg-blue-600 text-white px-6 py-2 rounded font-bold">保存</button>
              <button onClick={() => setEditMenu(null)} className="bg-gray-300 px-6 py-2 rounded font-bold">キャンセル</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {menus.map((menu, idx) => (
            <div key={menu.id} className={`bg-white p-4 rounded-lg border ${menu.isPopular ? "border-yellow-400 border-2" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => move(idx, -1)} disabled={idx === 0} className="text-xs px-1 bg-slate-200 rounded disabled:opacity-30">▲</button>
                    <button onClick={() => move(idx, 1)} disabled={idx === menus.length - 1} className="text-xs px-1 bg-slate-200 rounded disabled:opacity-30">▼</button>
                  </div>
                  <div>
                    {menu.isPopular && <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold mr-2">人気 No.1</span>}
                    <span className="font-bold text-lg">{menu.title}</span>
                    <span className="text-blue-600 font-black text-xl ml-3">{menu.priceNote}{menu.price}{menu.unit}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditMenu(menu)} className="text-blue-600 text-sm font-bold hover:underline">編集</button>
                  <button onClick={() => remove(menu.id)} className="text-red-500 text-sm font-bold hover:underline">削除</button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-12">{menu.description} → {menu.link}</p>
            </div>
          ))}
          {menus.length === 0 && <p className="text-center text-gray-400 py-8">まだメニューがありません</p>}
        </div>
      </div>
    </div>
  );
}
