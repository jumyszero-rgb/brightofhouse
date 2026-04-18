// @/src/app/admin/videos/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Video = {
  id: string;
  title: string;
  videoUrl: string;
  deviceType: string;
  createdAt: string;
};

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchVideos = async () => {
    const res = await fetch("/api/videos");
    if (res.ok) setVideos(await res.json());
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("⏳ 圧縮・アップロード中...（時間がかかります）");

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("失敗");

      setMessage("✅ アップロード完了！");
      (e.target as HTMLFormElement).reset();
      fetchVideos();
    } catch (error) {
      setMessage("❌ エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("削除しますか？")) return;
    await fetch("/api/videos", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    fetchVideos();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">動画管理</h1>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">← 戻る</Link>
        </div>

        {/* アップロードフォーム */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-bold text-gray-700 mb-4">新規動画アップロード</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">タイトル</label>
                <input name="title" type="text" required placeholder="例: 15秒CM" className="w-full p-2 border rounded text-black" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">種類（サイズ）</label>
                <select name="deviceType" className="w-full p-2 border rounded text-black">
                  <option value="pc">PC用 (横長)</option>
                  <option value="mobile">スマホ用 (縦長)</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">動画ファイル</label>
              <input name="file" type="file" accept="video/*" required className="w-full text-sm text-gray-500" />
              <p className="text-xs text-gray-400 mt-1">※自動で圧縮されます。そのままアップロードしてください。</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-bold disabled:bg-gray-400"
            >
              {loading ? "処理中..." : "アップロード開始"}
            </button>
            {message && <p className="text-center font-bold text-blue-600">{message}</p>}
          </form>
        </div>

        {/* 動画リスト */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className={`bg-black rounded overflow-hidden relative ${video.deviceType === 'mobile' ? 'aspect-[9/16] max-w-[200px] mx-auto' : 'aspect-video'}`}>
                <video src={video.videoUrl} controls className="w-full h-full object-contain" />
              </div>
              <div className="mt-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-800">{video.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${video.deviceType === 'pc' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {video.deviceType === 'pc' ? 'PC用' : 'スマホ用'}
                  </span>
                </div>
                <button onClick={() => handleDelete(video.id)} className="text-red-600 hover:text-red-800 text-sm font-bold">
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}