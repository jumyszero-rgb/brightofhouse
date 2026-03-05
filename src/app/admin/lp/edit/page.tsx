// @/src/app/admin/lp/edit/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import RichTextEditor from "@/components/RichTextEditor";

function EditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [previewImage, setPreviewImage] = useState("");

  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    linkTitle: "",
    status: "DRAFT",
    category: "CAMPAIGN",
    showOnHome: false,
    catchphrase: "",
    subCopy: "",
    content: "",
    ctaText: "無料お見積りはこちら",
    ctaLink: "/contact"
  });

  useEffect(() => {
    if (!editId) return;
    fetch(`/api/lp?id=${editId}`)
      .then(res => res.json())
      .then(data => {
        setFormData({
          slug: data.slug,
          title: data.title,
          linkTitle: data.linkTitle || "",
          status: data.status,
          category: data.category || "CAMPAIGN",
          showOnHome: data.showOnHome || false,
          catchphrase: data.catchphrase || "",
          subCopy: data.subCopy || "",
          content: data.content || "",
          ctaText: data.ctaText || "無料お見積りはこちら",
          ctaLink: data.ctaLink || "/contact"
        });
        if (data.heroImage) setPreviewImage(data.heroImage);
      });
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    if (editId) form.append("id", editId);
    form.set("content", formData.content);
    form.set("showOnHome", String(formData.showOnHome));
    form.set("category", formData.category);

    try {
      const res = await fetch("/api/lp", { method: editId ? "PUT" : "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "エラーが発生しました");
      alert(editId ? "更新しました" : "作成しました");
      router.push("/admin/lp");
      router.refresh();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally { setLoading(false); }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleContentChange = (value: string) => {
    setFormData(prev => ({ ...prev, content: value }));
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md text-black">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">{editId ? "編集" : "新規作成"}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-lg space-y-4 border border-slate-200">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">ページタイトル（H1 / SEO用）</label>
              <input name="title" required value={formData.title} onChange={handleChange} className="w-full p-2 border rounded" placeholder="例: 札幌市中央区のハウスクリーニングなら..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">リンク用タイトル（トップページ表示用 / 任意）</label>
              <input name="linkTitle" value={formData.linkTitle} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50" placeholder="例: 中央区 (空欄ならページタイトルを使用)" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">URL (slug)</label>
              <div className="flex items-center text-sm">
                <span className="text-gray-500 mr-1">/lp/ or /area/</span>
                <input name="slug" required value={formData.slug} onChange={handleChange} className="flex-1 p-2 border rounded" placeholder="例: sapporo-chuoku" />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 border-t pt-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">種類</label>
              <select name="category" value={formData.category} onChange={handleChange} className="p-2 border rounded font-bold bg-white text-black">
                <option value="CAMPAIGN">🔥 キャンペーン</option>
                <option value="AREA">📍 地域別ページ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">公開状態</label>
              <select name="status" value={formData.status} onChange={handleChange} className="p-2 border rounded font-bold bg-white text-black">
                <option value="DRAFT">下書き</option>
                <option value="PUBLISHED">公開中</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-sm font-bold text-blue-700 cursor-pointer">
                <input type="checkbox" name="showOnHome" checked={formData.showOnHome} onChange={handleChange} className="w-5 h-5 accent-blue-600" />
                トップページに表示する
              </label>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">メイン画像</label>
          {previewImage && <div className="relative h-40 w-full mb-2 overflow-hidden rounded border text-black"><Image src={previewImage} alt="Hero" fill className="object-cover" /></div>}
          <input name="heroImage" type="file" accept="image/*" className="w-full text-sm text-gray-500" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">キャッチコピー</label>
          <input name="catchphrase" value={formData.catchphrase} onChange={handleChange} className="w-full p-2 border rounded text-lg font-bold" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">サブコピー</label>
          <input name="subCopy" value={formData.subCopy} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>
        <div className="pb-8 text-black">
          <label className="block text-sm font-bold text-gray-700 mb-1">本文</label>
          <RichTextEditor value={formData.content} onChange={handleContentChange} />
        </div>
        <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div><label className="block text-sm font-bold text-gray-700 mb-1">ボタン文字</label>
          <input name="ctaText" value={formData.ctaText} onChange={handleChange} className="w-full p-2 border rounded" /></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-1">リンク先</label>
          <input name="ctaLink" value={formData.ctaLink} onChange={handleChange} className="w-full p-2 border rounded" /></div>
        </div>
        <div className="flex gap-4 pt-4 border-t">
          <button type="button" onClick={() => router.back()} className="flex-1 bg-gray-500 text-white py-3 rounded font-bold hover:bg-gray-600 transition-colors">キャンセル</button>
          <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition-colors">{loading ? "処理中..." : "保存する"}</button>
        </div>
        {message && <p className="text-center text-red-600 font-bold">{message}</p>}
      </form>
    </div>
  );
}

export default function LPEditPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Suspense fallback={<div>Loading...</div>}><EditForm /></Suspense>
    </div>
  );
}