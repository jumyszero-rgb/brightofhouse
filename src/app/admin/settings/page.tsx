"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminSettingsPage() {
  const [robotsTxt, setRobotsTxt] = useState("");
  const [reviewIpBlock, setReviewIpBlock] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setRobotsTxt(data.robotsTxt || "");
        setReviewIpBlock(data.reviewIpBlock ?? true);
      });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ robotsTxt, reviewIpBlock }),
    });
    if (res.ok) setMessage("✅ 保存しました");
    setLoading(false);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">SEO・サイト設定</h1>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">← 戻る</Link>
        </div>

        <div className="space-y-8">
          {/* robots.txt */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">robots.txt の内容</label>
            <textarea
              className="w-full h-64 p-4 font-mono text-sm border rounded bg-slate-50"
              value={robotsTxt}
              onChange={(e) => setRobotsTxt(e.target.value)}
            />
          </div>

          {/* アンケートIP制限 */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h2 className="font-bold text-amber-800 mb-3">📋 アンケートページ設定</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-700">IP制限（7日間の重複投稿ブロック）</p>
                <p className="text-xs text-slate-500 mt-1">
                  OFFにするとテスト時に何度でも投稿できます
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewIpBlock(!reviewIpBlock)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  reviewIpBlock ? "bg-green-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    reviewIpBlock ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs mt-2 font-bold text-center">
              現在：
              <span className={reviewIpBlock ? "text-green-600" : "text-red-500"}>
                {reviewIpBlock ? "ON（制限あり）" : "OFF（制限なし・テストモード）"}
              </span>
            </p>
            <p className="text-xs text-slate-400 mt-2">
              アンケートURL：<a href="/review" target="_blank" className="text-blue-500 underline">brightofhouse.jp/review</a>
            </p>
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
