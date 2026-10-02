// @/src/app/admin/page-heroes/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// 管理対象ページ（必要に応じて増やせます）
const PAGES: { key: string; label: string; note: string }[] = [
  { key: "service", label: "サービス一覧ページ", note: "/service の上部ヒーロー背景" },
  { key: "company", label: "会社概要ページ", note: "/company の上部ヒーロー背景" },
];

export default function AdminPageHeroesPage() {
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/page-heroes")
      .then((r) => r.json())
      .then((d) => setImages(d || {}))
      .catch(() => {});
  }, []);

  const save = async (key: string, imageUrl: string | null) => {
    setLoading(key);
    setMessage("");
    try {
      const res = await fetch("/api/page-heroes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, imageUrl }),
      });
      if (!res.ok) throw new Error();
      setImages((prev) => {
        const next = { ...prev };
        if (imageUrl) next[key] = imageUrl;
        else delete next[key];
        return next;
      });
      setMessage("✅ 保存しました");
    } catch {
      setMessage("❌ 保存に失敗しました");
    } finally {
      setLoading(null);
    }
  };

  const upload = async (key: string, file: File) => {
    setLoading(key);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/media", { method: "POST", body: fd });
      const d = await res.json();
      if (d.url) {
        await save(key, d.url);
      } else {
        alert("アップロードに失敗しました");
        setLoading(null);
      }
    } catch {
      alert("アップロードに失敗しました");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">ページ別ヒーロー画像</h1>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">← 戻る</Link>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          各ページ上部のヒーロー背景画像を設定します（未設定ならグラデーション背景）。自動でWebP変換されます。
          <br />
          ※トップページのヒーロー画像は「ヒーローエリア設定」から設定します。
        </p>

        <div className="space-y-6">
          {PAGES.map((p) => (
            <div key={p.key} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="font-bold text-gray-800">{p.label}</h2>
                  <p className="text-[11px] text-gray-400">{p.note}</p>
                </div>
                {images[p.key] && (
                  <button
                    type="button"
                    onClick={() => save(p.key, null)}
                    disabled={loading === p.key}
                    className="text-xs text-red-600 font-bold"
                  >
                    画像を解除
                  </button>
                )}
              </div>
              {images[p.key] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[p.key]} alt="" className="w-full h-40 object-cover rounded mb-2" />
              )}
              <input
                type="file"
                accept="image/*"
                disabled={loading === p.key}
                className="text-xs"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(p.key, f);
                  e.target.value = "";
                }}
              />
              {loading === p.key && <span className="text-xs text-gray-400 ml-2">処理中...</span>}
            </div>
          ))}
        </div>

        {message && <p className="text-center font-bold text-green-600 mt-6">{message}</p>}
      </div>
    </div>
  );
}
