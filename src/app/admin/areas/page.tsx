// @/src/app/admin/areas/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminAreasPage() {
  const [areas, setAreas] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  
  const initialForm = { title: "", regions: "", note: "", order: 0 };
  const [formData, setFormData] = useState(initialForm);

  const fetchAreas = async () => {
    const res = await fetch("/api/areas");
    if (res.ok) setAreas(await res.json());
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editId ? "PUT" : "POST";
    const body = editId ? { ...formData, id: editId } : formData;

    await fetch("/api/areas", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setFormData(initialForm);
    setEditId(null);
    fetchAreas();
  };

  const handleEdit = (area: any) => {
    setEditId(area.id);
    setFormData({
      title: area.title,
      regions: area.regions,
      note: area.note || "",
      order: area.order,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("削除しますか？")) return;
    await fetch("/api/areas", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    fetchAreas();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">対応エリア管理</h1>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">← 戻る</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* フォーム */}
          <div className="bg-white p-6 rounded-lg shadow-md h-fit">
            <h2 className="text-lg font-bold text-gray-700 mb-4">{editId ? "エリア編集" : "新規登録"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500">グループ名 (例: 清掃業務)</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded text-black" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500">地域リスト (改行区切り)</label>
                <textarea rows={5} required value={formData.regions} onChange={(e) => setFormData({...formData, regions: e.target.value})} className="w-full p-2 border rounded text-black" placeholder="札幌市全域&#13;&#10;江別市&#13;&#10;北広島市" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500">注釈 (任意)</label>
                <input type="text" value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} className="w-full p-2 border rounded text-black" placeholder="※出張費無料" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500">表示順</label>
                <input type="number" value={formData.order} onChange={(e) => setFormData({...formData, order: Number(e.target.value)})} className="w-full p-2 border rounded text-black" />
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
          </div>

          {/* リスト */}
          <div className="space-y-4">
            {areas.map((area) => (
              <div key={area.id} className="bg-white p-4 rounded-lg shadow border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-blue-600 border-b-2 border-blue-100 pb-1">
                    {area.title}
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(area)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">編集</button>
                    <button onClick={() => handleDelete(area.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">削除</button>
                  </div>
                </div>
                <ul className="text-sm text-slate-600 space-y-1 mb-3 whitespace-pre-wrap">
                  {area.regions}
                </ul>
                {area.note && (
                  <p className="text-xs text-slate-400 border-t pt-2">{area.note}</p>
                )}
              </div>
            ))}
            {areas.length === 0 && <p className="text-gray-500 text-center">登録されたエリアがありません</p>}
          </div>
        </div>
      </div>
    </div>
  );
}