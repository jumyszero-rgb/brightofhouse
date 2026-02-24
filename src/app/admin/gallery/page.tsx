// @/src/app/admin/gallery/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

type GalleryItem = {
  id: string;
  imageUrl: string;
  title: string | null;
};

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchImages = async () => {
    const res = await fetch("/api/gallery");
    if (res.ok) setImages(await res.json());
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await fetch("/api/gallery", { method: "POST", body: formData });
      if (res.ok) {
        (e.target as HTMLFormElement).reset();
        fetchImages();
        alert("登録しました");
      } else {
        alert("エラーが発生しました");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return;
    await fetch("/api/gallery", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    fetchImages();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">実績ギャラリー管理</h1>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">← 戻る</Link>
        </div>

        {/* 登録フォーム */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-bold text-gray-700 mb-4">新規画像登録 (自動WebP変換)</h2>
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-bold text-gray-700 mb-1">画像ファイル</label>
              <input name="file" type="file" accept="image/*" required className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-bold text-gray-700 mb-1">タイトル（任意）</label>
              <input name="title" type="text" placeholder="例: リビング清掃" className="w-full p-2 border rounded text-black" />
            </div>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400 w-full md:w-auto">
              {loading ? "処理中..." : "追加する"}
            </button>
          </form>
        </div>

        {/* 一覧表示 */}
        <h2 className="text-lg font-bold text-gray-700 mb-4">登録済み画像 ({images.length}枚)</h2>
        {images.length === 0 ? (
          <p className="text-gray-500">画像がありません。</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {images.map((img) => (
              <div key={img.id} className="bg-white p-3 rounded-lg shadow hover:shadow-md transition-shadow relative group">
                <div className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                  <Image src={img.imageUrl} alt="gallery" fill className="object-cover" />
                </div>
                <p className="text-xs text-gray-600 mt-2 truncate font-bold">{img.title || "タイトルなし"}</p>
                
                {/* 削除ボタン (ホバー時またはスマホで表示) */}
                <button
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-2 right-2 bg-red-600 text-white text-xs px-3 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}