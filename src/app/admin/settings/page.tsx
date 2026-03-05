// @/src/app/admin/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminSettingsPage() {
  const [robotsTxt, setRobotsTxt] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => setRobotsTxt(data.robotsTxt));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      body: JSON.stringify({ robotsTxt }),
    });
    if (res.ok) setMessage("✅ 保存しました");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">SEO・サイト設定</h1>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">← 戻る</Link>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">robots.txt の内容</label>
            <textarea
              className="w-full h-64 p-4 font-mono text-sm border rounded bg-slate-50"
              value={robotsTxt}
              onChange={(e) => setRobotsTxt(e.target.value)}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700"
          >
            {loading ? "保存中..." : "設定を保存"}
          </button>
          {message && <p className="text-center font-bold text-green-600">{message}</p>}
        </div>
      </div>
    </div>
  );
}