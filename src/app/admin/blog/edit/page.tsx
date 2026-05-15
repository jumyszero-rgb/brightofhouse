// @/src/app/admin/blog/edit/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RichTextEditor from "@/components/RichTextEditor";
import Link from "next/link";

function BlogEditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [loadingSeo, setLoadingSeo] = useState(false);
  const [targetKeywords, setTargetKeywords] = useState("");

  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    status: "DRAFT",
    content: "",
    instaContent: "",
    xContent: "",
    googleContent: "",
    metaKeywords: "",
    metaDescription: "",
    noIndex: false,
  });

  useEffect(() => {
    if (!editId) return;
    fetch(`/api/blog?id=${editId}`)
      .then(res => res.json())
      .then(data => {
        setFormData({
          slug: data.slug,
          title: data.title,
          status: data.status,
          content: data.content || "",
          instaContent: data.instaContent || "",
          xContent: data.xContent || "",
          googleContent: data.googleContent || "",
          metaKeywords: data.metaKeywords || "",
          metaDescription: data.metaDescription || "",
          noIndex: data.noIndex || false,
        });
      });
  }, [editId]);

  const handleAiGenerate = async () => {
    if (!targetKeywords) return alert("テーマを入力してください");
    setAiLoading(true);
    try {
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: targetKeywords }),
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({
          ...prev,
          title: data.title,
          slug: data.slug,
          content: data.blog,
          instaContent: data.insta,
          xContent: data.x,
          googleContent: data.google,
          metaKeywords: data.metaKeywords || "",
          metaDescription: data.metaDescription || "",
        }));
      }
    } catch (e) {
      alert("AI執筆に失敗しました");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSeoSuggest = async () => {
    if (!formData.title || !formData.content) return alert("タイトルと本文を先に入力してください");
    setLoadingSeo(true);
    try {
      const res = await fetch("/api/seo/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formData.title, content: formData.content }),
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, metaKeywords: data.metaKeywords, metaDescription: data.metaDescription }));
      }
    } finally {
      setLoadingSeo(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch("/api/blog", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editId ? { ...formData, id: editId } : formData),
    });
    if (res.ok) {
      alert("保存しました");
      router.push("/admin/blog");
    }
    setLoading(false);
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 text-black">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{editId ? "記事編集" : "AI新規執筆"}</h1>
        <Link href="/admin/blog" className="text-blue-600 hover:underline">← 一覧に戻る</Link>
      </div>

      {/* AI執筆パネル */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6 rounded-2xl text-white shadow-lg">
        <h2 className="font-bold mb-4 flex items-center gap-2">✨ AI自動執筆アシスタント</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="記事のテーマを入力"
            className="flex-1 p-3 rounded-xl text-black outline-none"
            value={targetKeywords}
            onChange={(e) => setTargetKeywords(e.target.value)}
          />
          <button onClick={handleAiGenerate} disabled={aiLoading} className="bg-yellow-400 text-indigo-900 px-8 py-3 rounded-xl font-black hover:bg-yellow-300 disabled:bg-gray-400 transition-all">
            {aiLoading ? "執筆中..." : "AIで一括生成"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
            <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded text-lg font-bold" placeholder="タイトル" />
            <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="w-full p-2 border rounded text-sm font-mono" placeholder="url-slug" />
            <RichTextEditor value={formData.content} onChange={(val) => setFormData(p => ({...p, content: val}))} />
          </div>

          {/* SEO設定エリア */}
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-indigo-900">🔍 ブログSEO設定</h2>
              <button type="button" onClick={handleSeoSuggest} disabled={loadingSeo} className="bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-indigo-700">
                {loadingSeo ? "生成中..." : "✨ AIにSEO案を作成させる"}
              </button>
            </div>
            <input name="metaKeywords" value={formData.metaKeywords} onChange={handleChange} placeholder="重要キーワード（3〜5個）" className="w-full p-2 border border-indigo-200 rounded text-sm" />
            <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows={3} placeholder="検索結果用の説明文" className="w-full p-2 border border-indigo-200 rounded text-sm" />
          </div>
        </div>

        {/* 右側：SNSと公開設定 */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-pink-500">
            <h3 className="font-bold text-pink-600 mb-2 text-sm">📸 Instagram</h3>
            <textarea name="instaContent" rows={6} value={formData.instaContent} onChange={handleChange} className="w-full p-2 text-xs border rounded bg-slate-50" />
          </div>
          <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-slate-800">
            <h3 className="font-bold text-slate-800 mb-2 text-sm">🐦 X (Twitter)</h3>
            <textarea name="xContent" rows={4} value={formData.xContent} onChange={handleChange} className="w-full p-2 text-xs border rounded bg-slate-50" />
          </div>
          <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-blue-600">
            <h3 className="font-bold text-blue-600 mb-2 text-sm">🏪 Googleプロフィール</h3>
            <textarea name="googleContent" rows={6} value={formData.googleContent} onChange={handleChange} className="w-full p-2 text-xs border rounded bg-slate-50" />
          </div>

          <div className="bg-slate-800 p-6 rounded-xl shadow-lg text-white space-y-4">
            <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded text-black font-bold">
              <option value="DRAFT">下書き保存</option>
              <option value="PUBLISHED">公開する</option>
            </select>

            <label className="flex items-center gap-2 text-sm font-bold text-red-400 cursor-pointer">
              <input type="checkbox" name="noIndex" checked={formData.noIndex} onChange={handleChange} className="w-5 h-5 accent-red-600" />
              インデックスしない（noindex）
            </label>

            <button onClick={handleSave} disabled={loading} className="w-full bg-green-500 text-white py-4 rounded-xl font-black text-lg hover:bg-green-400 shadow-lg">
              {loading ? "保存中..." : "保存して完了"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminBlogEdit() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <Suspense fallback={<div>読み込み中...</div>}><BlogEditForm /></Suspense>
    </div>
  );
}
