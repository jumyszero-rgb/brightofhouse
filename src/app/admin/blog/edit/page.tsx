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

  const [loading, setLoading] = useState(false); // 保存ボタンのローディング
  const [aiLoading, setAiLoading] = useState(false); // AI生成ボタンのローディング
  const [targetKeywords, setTargetKeywords] = useState(""); // AIに与えるキーワード

  const [formData, setFormData] = useState({
    slug: "", title: "", status: "DRAFT", content: "",
    instaContent: "", xContent: "", googleContent: ""
  });

  // 編集モードの場合、既存記事を読み込む
  useEffect(() => {
    if (!editId) return;
    fetch(`/api/blog?id=${editId}`).then(res => res.json()).then(data => setFormData(data));
  }, [editId]);

  // AI執筆ボタンの処理
  const handleAiGenerate = async () => {
    if (!targetKeywords) return alert("キーワードを入力してください");
    setAiLoading(true); // ローディング開始
    try {
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: targetKeywords }),
      });
      
      if (!res.ok) throw new Error("AIからの生成に失敗しました");
      
      const data = await res.json();
      
      // AIから生成された全データをformDataにセット
      setFormData({
        ...formData,
        title: data.title,
        slug: data.slug,
        content: data.blog,
        instaContent: data.insta,
        xContent: data.x,
        googleContent: data.google
      });
      
    } catch (e: any) { // 明示的に any 型を指定
      alert(`AI執筆に失敗しました: ${e.message}`); 
    } finally { 
      setAiLoading(false); // ローディング終了
    }
  };

  // 記事保存の処理
  const handleSave = async () => {
    setLoading(true); // 保存ローディング開始
    const res = await fetch("/api/blog", {
      method: editId ? "PUT" : "POST", // 編集か新規かでメソッドを切り替え
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editId ? { ...formData, id: editId } : formData),
    });
    if (res.ok) {
      alert("記事を保存しました");
      router.push("/admin/blog"); // 一覧画面へ戻る
    } else {
      alert("保存に失敗しました");
    }
    setLoading(false); // 保存ローディング終了
  };

  // 通常の入力フィールドの変更ハンドラ
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // リッチテキストエディタの変更ハンドラ
  const handleContentChange = (value: string) => {
    setFormData(prev => ({ ...prev, content: value }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 text-black">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{editId ? "記事編集" : "AI新規執筆"}</h1>
        <Link href="/admin/blog" className="text-blue-600 hover:underline">← ブログ一覧に戻る</Link>
      </div>

      {/* 1. AI自動執筆パネル */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6 rounded-2xl text-white shadow-lg">
        <h2 className="font-bold mb-4 flex items-center gap-2">✨ AI自動執筆アシスタント</h2>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="記事のテーマを入力（例：キッチンクリーニングのメリット）" 
            className="flex-1 p-3 rounded-xl text-black outline-none"
            value={targetKeywords}
            onChange={(e) => setTargetKeywords(e.target.value)}
            disabled={aiLoading} // AI生成中は入力不可に
          />
          <button 
            onClick={handleAiGenerate}
            disabled={aiLoading}
            className="bg-yellow-400 text-indigo-900 px-8 py-3 rounded-xl font-black hover:bg-yellow-300 disabled:bg-gray-400 transition-all shadow-md"
          >
            {aiLoading ? "AIが執筆中..." : "AIで一括生成"}
          </button>
        </div>
        <p className="text-xs mt-3 opacity-80">※AI執筆後、タイトル・スラッグ・本文・SNS投稿文が自動入力されます。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側：ブログ本文（リッチエディタ） */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">自動生成タイトル</label>
              <input 
                type="text" 
                name="title" 
                value={formData.title} 
                onChange={handleChange}
                className="w-full p-2 border rounded text-lg font-bold bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">URLスラッグ</label>
              <input 
                type="text" 
                name="slug" 
                value={formData.slug} 
                onChange={handleChange}
                className="w-full p-2 border rounded text-sm font-mono bg-slate-50"
                placeholder="air-con-cleaning-tips"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">ブログ本文</label>
              <RichTextEditor 
                value={formData.content} 
                onChange={handleContentChange} 
              />
            </div>
          </div>
        </div>

        {/* 右側：SNS投稿用テキスト */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-pink-500">
            <h3 className="font-bold text-pink-600 mb-2 flex items-center gap-2 text-sm">📸 Instagram用</h3>
            <textarea 
              rows={8} 
              name="instaContent" 
              value={formData.instaContent || ""} 
              onChange={handleChange}
              className="w-full p-2 text-xs border rounded bg-slate-50 leading-relaxed"
            />
          </div>
          <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-slate-800">
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm">🐦 X (Twitter)用</h3>
            <textarea 
              rows={4} 
              name="xContent" 
              value={formData.xContent || ""} 
              onChange={handleChange}
              className="w-full p-2 text-xs border rounded bg-slate-50"
            />
          </div>
          <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-blue-600">
            <h3 className="font-bold text-blue-600 mb-2 flex items-center gap-2 text-sm">🏪 Googleプロフィール用</h3>
            <textarea 
              rows={6} 
              name="googleContent" 
              value={formData.googleContent || ""} 
              onChange={handleChange}
              className="w-full p-2 text-xs border rounded bg-slate-50"
            />
          </div>

          <div className="bg-slate-800 p-6 rounded-xl shadow-lg text-white space-y-4">
            <select 
              name="status" 
              value={formData.status} 
              onChange={handleChange}
              className="w-full p-2 border rounded text-black font-bold bg-white"
            >
              <option value="DRAFT">下書き保存</option>
              <option value="PUBLISHED">公開する</option>
            </select>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-green-500 text-white py-4 rounded-xl font-black text-lg hover:bg-green-400 transition-all shadow-lg"
            >
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
      <Suspense fallback={<div>読み込み中...</div>}>
        <BlogEditForm />
      </Suspense>
    </div>
  );
}