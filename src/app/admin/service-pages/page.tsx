// @/src/app/admin/service-pages/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminServicePageList() {
  const [pages, setPages] = useState<any[]>([]);

  const fetchPages = async () => {
    const res = await fetch("/api/service-pages");
    if (res.ok) setPages(await res.json());
  };

  useEffect(() => { fetchPages(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return;
    await fetch("/api/service-pages", { 
      method: "DELETE", 
      body: JSON.stringify({ id }) 
    });
    fetchPages();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">サービス詳細ページ管理</h1>
          <div className="flex gap-4">
            <Link href="/admin" className="bg-gray-500 text-white px-4 py-2 rounded">メニュー戻る</Link>
            <Link href="/admin/service-pages/edit" className="bg-blue-600 text-white px-6 py-2 rounded font-bold">＋ 新規作成</Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 text-sm font-bold">状態</th>
                <th className="p-4 text-sm font-bold">タイトル / URL</th>
                <th className="p-4 text-sm font-bold">更新日</th>
                <th className="p-4 text-sm font-bold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${page.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                      {page.status === 'PUBLISHED' ? '公開中' : '下書き'}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="font-bold">{page.title}</p>
                    <p className="text-xs text-blue-500">/service/{page.slug}</p>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <Link href={`/admin/service-pages/edit?id=${page.id}`} className="text-blue-600 hover:underline font-bold">編集</Link>
                    <button onClick={() => handleDelete(page.id)} className="text-red-500 hover:underline font-bold">削除</button>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr><td colSpan={4} className="p-12 text-center text-gray-400">登録されたページがありません。</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}