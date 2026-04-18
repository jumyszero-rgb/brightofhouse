// @/src/app/admin/blog/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function BlogSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    fixedKeywords: "",
    defaultIntro: "",
    defaultOutro: "",
  });

  useEffect(() => {
    fetch("/api/blog/settings")
      .then(res => res.json())
      .then(data => setFormData(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/blog/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) setMessage("✅ 設定を保存しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">AIブログ執筆設定</h1>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">← 戻る</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">毎回含めるキーワード（カンマ区切り）</label>
            <input
              type="text"
              value={formData.fixedKeywords}
              onChange={(e) => setFormData({ ...formData, fixedKeywords: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="札幌, ハウスクリーニング, 掃除代行"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">毎回最初に記載する定型文</label>
            <textarea
              rows={4}
              value={formData.defaultIntro}
              onChange={(e) => setFormData({ ...formData, defaultIntro: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="北海道ブライトオブハウスのブログへようこそ。..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">毎回最後に記載する定型文</label>
            <textarea
              rows={4}
              value={formData.defaultOutro}
              onChange={(e) => setFormData({ ...formData, defaultOutro: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="お見積りは無料です。お気軽にお問い合わせください。..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700"
          >
            {loading ? "保存中..." : "設定を保存"}
          </button>
          {message && <p className="text-center font-bold text-green-600">{message}</p>}
        </form>
      </div>
    </div>
  );
}