// @/src/app/admin/hero/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminHeroPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    mobileHeight: "h-[50vh]",
    pcHeight: "md:h-[65vh]",
    btn1Text: "",
    btn1Link: "",
    btn2Text: "",
    btn2Link: "",
  });

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => res.json())
      .then((data) => setFormData(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed");
      setMessage("✅ 更新しました");
    } catch (error) {
      setMessage("❌ エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">ヒーローエリア設定</h1>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">← 戻る</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 高さ設定 */}
          <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">スマホ時の高さ</label>
              <select
                name="mobileHeight"
                value={formData.mobileHeight}
                onChange={handleChange}
                className="w-full p-2 border rounded text-black"
              >
                <option value="h-[40vh]">小 (40%)</option>
                <option value="h-[50vh]">標準 (50%)</option>
                <option value="h-[60vh]">大 (60%)</option>
                <option value="h-[80vh]">特大 (80%)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">PC時の高さ</label>
              <select
                name="pcHeight"
                value={formData.pcHeight}
                onChange={handleChange}
                className="w-full p-2 border rounded text-black"
              >
                <option value="md:h-[50vh]">小 (50%)</option>
                <option value="md:h-[65vh]">標準 (65%)</option>
                <option value="md:h-[80vh]">大 (80%)</option>
                <option value="md:h-screen">全画面 (100%)</option>
              </select>
            </div>
          </div>

          {/* テキスト設定 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">メインタイトル</label>
            <input
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-2 border rounded text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">サブタイトル</label>
            <input
              name="subtitle"
              type="text"
              value={formData.subtitle}
              onChange={handleChange}
              className="w-full p-2 border rounded text-black"
            />
          </div>

          {/* ボタン設定 (省略せず記述) */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ボタン1 テキスト</label>
              <input name="btn1Text" type="text" value={formData.btn1Text} onChange={handleChange} className="w-full p-2 border rounded text-black text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ボタン1 リンク先</label>
              <input name="btn1Link" type="text" value={formData.btn1Link} onChange={handleChange} className="w-full p-2 border rounded text-black text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ボタン2 テキスト</label>
              <input name="btn2Text" type="text" value={formData.btn2Text} onChange={handleChange} className="w-full p-2 border rounded text-black text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ボタン2 リンク先</label>
              <input name="btn2Link" type="text" value={formData.btn2Link} onChange={handleChange} className="w-full p-2 border rounded text-black text-sm" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-bold"
          >
            {loading ? "保存中..." : "設定を保存"}
          </button>

          {message && <p className="text-center font-bold text-green-600">{message}</p>}
        </form>
      </div>
    </div>
  );
}