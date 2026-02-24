// @/src/app/admin/company/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminCompanyPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  const [formData, setFormData] = useState({
    name: "北海道ブライトハウス",
    representative: "",
    address: "",
    tel: "",
    businessContent: "",
    businessHours: "",
    mapCode: "",
  });

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/company");
      if (res.ok) {
        const data = await res.json();
        if (data.id) { // データが存在する場合のみセット
          setFormData({
            name: data.name || "",
            representative: data.representative || "",
            address: data.address || "",
            tel: data.tel || "",
            businessContent: data.businessContent || "",
            businessHours: data.businessHours || "",
            mapCode: data.mapCode || "",
          });
        }
      }
    };
    fetchData();
  }, []);

  // 更新処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("更新失敗");
      setMessage("✅ 会社情報を更新しました");
    } catch (error) {
      setMessage("❌ エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">会社概要の編集</h1>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">
            ← メニューに戻る
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">会社名</label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">代表者名</label>
            <input
              name="representative"
              type="text"
              value={formData.representative}
              onChange={handleChange}
              className="w-full p-2 border rounded text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">所在地（住所）</label>
            <textarea
              name="address"
              rows={3}
              value={formData.address}
              onChange={handleChange}
              className="w-full p-2 border rounded text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">電話番号</label>
            <input
              name="tel"
              type="text"
              value={formData.tel}
              onChange={handleChange}
              className="w-full p-2 border rounded text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">事業内容</label>
            <textarea
              name="businessContent"
              rows={3}
              value={formData.businessContent}
              onChange={handleChange}
              className="w-full p-2 border rounded text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">営業時間</label>
            <input
              name="businessHours"
              type="text"
              value={formData.businessHours}
              onChange={handleChange}
              className="w-full p-2 border rounded text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Googleマップ埋め込みコード (iframe)
            </label>
            <p className="text-xs text-gray-500 mb-1">
              Googleマップで「共有」→「地図を埋め込む」からコピーしたHTMLを貼り付けてください。
            </p>
            <textarea
              name="mapCode"
              rows={4}
              value={formData.mapCode}
              onChange={handleChange}
              className="w-full p-2 border rounded text-black text-xs font-mono"
              placeholder='<iframe src="https://www.google.com/maps/embed?..." ...></iframe>'
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-bold"
          >
            {loading ? "更新中..." : "保存する"}
          </button>

          {message && <p className="text-center font-bold text-green-600 mt-4">{message}</p>}
        </form>
      </div>
    </div>
  );
}