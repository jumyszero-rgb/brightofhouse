// @/src/app/admin/before-after/edit/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

// 検索パラメータを使うコンポーネント
function EditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id"); // URLから ?id=xxx を取得

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<{ before: string; after: string }>({ before: "", after: "" });

  // 初期値
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
  });

  // 編集モードの場合、データを取得してセット
  useEffect(() => {
    if (!editId) return;

    const fetchData = async () => {
      const res = await fetch("/api/before-after");
      const items = await res.json();
      const target = items.find((i: any) => i.id === editId);
      
      if (target) {
        setFormData({
          title: target.title,
          description: target.description || "",
          date: new Date(target.createdAt).toISOString().split('T')[0],
        });
        setPreview({
          before: target.beforeUrl,
          after: target.afterUrl,
        });
      }
    };
    fetchData();
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(e.currentTarget);
    if (editId) form.append("id", editId);

    try {
      const method = editId ? "PUT" : "POST";
      const res = await fetch("/api/before-after", { method, body: form });

      if (!res.ok) throw new Error("エラーが発生しました");

      alert(editId ? "更新しました" : "登録しました");
      router.push("/admin/before-after"); // 一覧に戻る
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("❌ 処理に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        {editId ? "実績を編集" : "新規登録"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">作業日</label>
            <input
              name="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-2 border rounded text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">タイトル</label>
            <input
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2 border rounded text-black"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">説明文</label>
          <textarea
            name="description"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 border rounded text-black"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before画像 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Before画像 {editId && <span className="text-red-500 text-xs">(変更時のみ選択)</span>}
            </label>
            {preview.before && editId && (
              <div className="mb-2 relative h-32 w-full bg-gray-100 rounded overflow-hidden">
                <Image src={preview.before} alt="current" fill className="object-cover" />
              </div>
            )}
            <input
              name="beforeImage"
              type="file"
              accept="image/*"
              required={!editId}
              className="w-full text-sm text-gray-500"
            />
          </div>

          {/* After画像 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              After画像 {editId && <span className="text-red-500 text-xs">(変更時のみ選択)</span>}
            </label>
            {preview.after && editId && (
              <div className="mb-2 relative h-32 w-full bg-gray-100 rounded overflow-hidden">
                <Image src={preview.after} alt="current" fill className="object-cover" />
              </div>
            )}
            <input
              name="afterImage"
              type="file"
              accept="image/*"
              required={!editId}
              className="w-full text-sm text-gray-500"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-500 text-white py-3 rounded hover:bg-gray-600"
          >
            戻る
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-bold"
          >
            {loading ? "送信中..." : (editId ? "更新して保存" : "登録する")}
          </button>
        </div>
        
        {message && <p className="text-center text-red-600 font-bold">{message}</p>}
      </form>
    </div>
  );
}

// Suspenseでラップ（useSearchParamsを使うため必須）
export default function EditPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Suspense fallback={<div>Loading...</div>}>
        <EditForm />
      </Suspense>
    </div>
  );
}