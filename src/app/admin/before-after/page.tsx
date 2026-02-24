// @/src/app/admin/before-after/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

type Item = {
  id: string;
  title: string;
  description: string | null;
  beforeUrl: string;
  afterUrl: string;
  createdAt: string;
};

export default function AdminBeforeAfterList() {
  const [items, setItems] = useState<Item[]>([]);

  const fetchItems = async () => {
    const res = await fetch("/api/before-after");
    if (res.ok) {
      const data = await res.json();
      setItems(data);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return;
    await fetch("/api/before-after", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    fetchItems();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">ビフォーアフター管理</h1>
          <div className="flex gap-4">
            <Link
              href="/admin"
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              メニューへ戻る
            </Link>
            <Link
              href="/admin/before-after/edit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-bold"
            >
              ＋ 新規登録
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">画像</th>
                <th className="p-4 text-sm font-semibold text-gray-600">日付</th>
                <th className="p-4 text-sm font-semibold text-gray-600">タイトル</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-4 w-24">
                    <div className="relative w-16 h-16 bg-gray-200 rounded overflow-hidden">
                      <Image src={item.afterUrl} alt="thumb" fill className="object-cover" />
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-medium text-gray-800">
                    {item.title}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Link
                      href={`/admin/before-after/edit?id=${item.id}`}
                      className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200"
                    >
                      編集
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    データがありません。新規登録してください。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}