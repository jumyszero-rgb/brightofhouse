// @/src/app/admin/blog/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminBlogList() {
  const [posts, setPosts] = useState<any[]>([]);

  const fetchPosts = async () => {
    const res = await fetch("/api/blog?all=true");
    if (res.ok) setPosts(await res.json());
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("記事を削除しますか？")) return;
    await fetch("/api/blog", { method: "DELETE", body: JSON.stringify({ id }) });
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">ブログ管理</h1>
          <div className="flex gap-4">
            <Link href="/admin" className="bg-gray-500 text-white px-4 py-2 rounded">メニュー戻る</Link>
            <Link href="/admin/blog/edit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold">＋ 新規AI執筆</Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 text-sm font-bold">状態</th>
                <th className="p-4 text-sm font-bold">タイトル / URL</th>
                <th className="p-4 text-sm font-bold">作成日</th>
                <th className="p-4 text-sm font-bold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    {/* ▼ 修正: status表示ロジックを強化 */}
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${post.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                      {post.status === 'PUBLISHED' ? '公開中' : '下書き'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold">{post.title}</div>
                    <div className="text-xs text-blue-500">/blog/{post.slug}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/blog/edit?id=${post.id}`} className="text-blue-600 hover:underline mr-4">編集</Link>
                    <button onClick={() => handleDelete(post.id)} className="text-red-500 hover:underline">削除</button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    記事がありません。新規AI執筆で作成してください。
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