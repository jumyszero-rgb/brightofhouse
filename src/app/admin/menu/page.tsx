// @/src/app/admin/menu/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// 初期データ（価格補足を追加）
const DEFAULT_MENUS = [
  {
    title: "水回りセットプラン",
    price: "16,640",
    priceNote: "2点", // 補足
    unit: "円〜",
    description: "キッチン・浴室・トイレなどまとめてピカピカに！",
    features: "✅ キッチン + レンジフード\n✅ 浴室 + 洗面所 + トイレ\n✅ 組み合わせ自由！",
    isPopular: true,
    order: 1,
    link: "/service"
  },
  {
    title: "エアコン分解洗浄",
    price: "9,900",
    priceNote: "壁掛けタイプ", // 補足
    unit: "円〜",
    description: "カビやニオイを徹底除去。効きが良くなり電気代節約にも。",
    features: "✅ 高圧洗浄で内部まで綺麗に\n✅ 防カビコーティング対応\n✅ お掃除機能付きも対応可",
    isPopular: false,
    order: 2,
    link: "/service"
  },
  {
    title: "空室清掃・遺品整理",
    price: "16,500",
    priceNote: "1R / 1K", // 補足
    unit: "円〜",
    description: "お引越し前後や、お部屋の片付け・整理に。",
    features: "✅ 退去時の全体清掃\n✅ 不用品回収も同時に可能\n✅ 特殊清掃も対応",
    isPopular: false,
    order: 3,
    link: "/service"
  }
];

export default function AdminMenuPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  
  // フォーム初期値 (priceNoteを追加)
  const initialForm = {
    title: "", price: "", priceNote: "", unit: "円〜", description: "", features: "", isPopular: false, order: 0, link: "/service"
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchMenus = async () => {
    const res = await fetch("/api/menu");
    if (res.ok) setMenus(await res.json());
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // 初期データ登録
  const loadDefaults = async () => {
    if (!confirm("現在のデータをリセットし、初期データ（3件）を登録しますか？")) return;
    
    // 既存データがある場合は手動削除が必要ですが、ここでは追加のみ行います
    for (const menu of DEFAULT_MENUS) {
      await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(menu),
      });
    }
    fetchMenus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editId ? "PUT" : "POST";
    const body = editId ? { ...formData, id: editId } : formData;

    await fetch("/api/menu", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setFormData(initialForm);
    setEditId(null);
    fetchMenus();
  };

  const handleEdit = (menu: any) => {
    setEditId(menu.id);
    setFormData({
      title: menu.title,
      price: menu.price,
      priceNote: menu.priceNote || "", // 補足
      unit: menu.unit,
      description: menu.description || "",
      features: menu.features || "",
      isPopular: menu.isPopular,
      order: menu.order,
      link: menu.link,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("削除しますか？")) return;
    await fetch("/api/menu", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    fetchMenus();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">人気メニュー・料金管理</h1>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">← 戻る</Link>
        </div>

        {menus.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6 flex justify-between items-center">
            <p className="text-yellow-800 text-sm">データがありません。初期データを読み込みますか？</p>
            <button onClick={loadDefaults} className="bg-yellow-500 text-white px-4 py-2 rounded font-bold hover:bg-yellow-600 text-sm">
              初期データを登録
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* フォーム */}
          <div className="bg-white p-6 rounded-lg shadow-md h-fit">
            <h2 className="text-lg font-bold text-gray-700 mb-4">{editId ? "メニュー編集" : "新規登録"}</h2>
            
            {!editId && menus.length >= 3 ? (
              <p className="text-sm text-red-500">※トップページには3つまで表示されます。既存のメニューを編集してください。</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500">メニュー名</label>
                  <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded text-black" />
                </div>
                
                {/* 価格設定エリア */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500">価格補足 (例: 2点, 壁掛けタイプ)</label>
                    <input type="text" value={formData.priceNote} onChange={(e) => setFormData({...formData, priceNote: e.target.value})} className="w-full p-2 border rounded text-black" placeholder="任意" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500">価格 (数字)</label>
                    <input type="text" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full p-2 border rounded text-black" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500">単位</label>
                    <input type="text" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full p-2 border rounded text-black" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500">説明文</label>
                  <textarea rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded text-black" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500">特徴リスト (改行区切り)</label>
                  <textarea rows={3} value={formData.features} onChange={(e) => setFormData({...formData, features: e.target.value})} className="w-full p-2 border rounded text-black" placeholder="✅ キッチン&#13;&#10;✅ 浴室" />
                </div>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={formData.isPopular} onChange={(e) => setFormData({...formData, isPopular: e.target.checked})} />
                    人気No.1フラグ
                  </label>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500">表示順</label>
                    <input type="number" value={formData.order} onChange={(e) => setFormData({...formData, order: Number(e.target.value)})} className="w-full p-2 border rounded text-black" />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold">
                    {editId ? "更新" : "登録"}
                  </button>
                  {editId && (
                    <button type="button" onClick={() => {setEditId(null); setFormData(initialForm);}} className="bg-gray-500 text-white px-4 rounded hover:bg-gray-600">
                      中止
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* リスト表示 */}
          <div className="lg:col-span-2 space-y-4">
            {menus.map((menu) => (
              <div key={menu.id} className={`bg-white p-4 rounded-lg shadow border-l-4 ${menu.isPopular ? "border-yellow-400" : "border-gray-200"} flex justify-between items-start`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {menu.isPopular && <span className="bg-yellow-400 text-yellow-900 text-[10px] px-2 py-0.5 rounded-full font-bold">人気No.1</span>}
                    <h3 className="font-bold text-gray-800">{menu.title}</h3>
                  </div>
                  <div className="text-blue-600 font-bold text-lg mt-1">
                    {menu.priceNote && <span className="text-sm text-gray-500 mr-2">{menu.priceNote}</span>}
                    {menu.price}<span className="text-sm text-gray-500 font-normal">{menu.unit}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{menu.description}</p>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <button onClick={() => handleEdit(menu)} className="text-xs bg-green-100 text-green-700 px-3 py-2 rounded hover:bg-green-200 font-bold">編集</button>
                  <button onClick={() => handleDelete(menu.id)} className="text-xs bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200 font-bold">削除</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}