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
    status: "DRAFT",
    showOnHome: false, // トップページ表示フラグ
    catchphrase: "",
    subCopy: "",
    content: "",
    ctaText: "無料お見積りはこちら",
    ctaLink: "/contact"
  });

  // 編集モード時のデータ取得
  useEffect(() => {
    if (!editId) return;
    fetch(`/api/lp?id=${editId}`)
      .then(res => res.json())
      .then(data => {
        setFormData({
          slug: data.slug,
          title: data.title,
          status: data.status,
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
    
    // リッチテキストとチェックボックスの値を手動でセット
    form.set("content", formData.content);
    form.set("showOnHome", String(formData.showOnHome));

    try {
      const res = await fetch("/api/lp", {
        method: editId ? "PUT" : "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "エラーが発生しました");

      alert(editId ? "更新しました" : "作成しました");
      router.push("/admin/lp");
      router.refresh();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleContentChange = (value: string) => {
    setFormData(prev => ({ ...prev, content: value }));
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md text-black">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">{editId ? "LP編集" : "新規LP作成"}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 基本設定エリア */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-4 border border-slate-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">ページタイトル</label>
              <input name="title" required value={formData.title} onChange={handleChange} className="w-full p-2 border rounded" placeholder="例: 春のキャンペーン" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">URL (英数字ハイフン)</label>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-1">/lp/</span>
                <input name="slug" required value={formData.slug} onChange={handleChange} className="flex-1 p-2 border rounded" placeholder="例: spring-sale" />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 border-t pt-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">公開状態</label>
              <select name="status" value={formData.status} onChange={handleChange} className="p-2 border rounded font-bold">
                <option value="DRAFT">下書き (非公開)</option>
                <option value="PUBLISHED">公開中</option>
              </select>
            </div>
            
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-sm font-bold text-blue-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="showOnHome"
                  checked={formData.showOnHome} 
                  onChange={handleChange} 
                  className="w-5 h-5 accent-blue-600"
                />
                トップページにキャンペーンとして表示する
              </label>
            </div>
          </div>
        </div>

        {/* 画像設定 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">メイン画像 {editId && <span className="text-xs text-red-500">(変更時のみ選択)</span>}</label>
          {previewImage && editId && (
            <div className="mb-2 relative h-40 w-full bg-gray-100 rounded overflow-hidden">
              <Image src={previewImage} alt="Hero" fill className="object-cover" />
            </div>
          )}
          <input name="heroImage" type="file" accept="image/*" required={!editId} className="w-full text-sm text-gray-500" />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">キャッチコピー</label>
          <input name="catchphrase" value={formData.catchphrase} onChange={handleChange} className="w-full p-2 border rounded text-lg font-bold" />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">サブコピー</label>
          <input name="subCopy" value={formData.subCopy} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>

        <div className="pb-8">
          <label className="block text-sm font-bold text-gray-700 mb-1">本文</label>
          <RichTextEditor value={formData.content} onChange={handleContentChange} />
        </div>

        <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">ボタンの文字</label>
            <input name="ctaText" value={formData.ctaText} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">ボタンのリンク先</label>
            <input name="ctaLink" value={formData.ctaLink} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <button type="button" onClick={() => router.back()} className="flex-1 bg-gray-500 text-white py-3 rounded font-bold hover:bg-gray-600">キャンセル</button>
          <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700">
            {loading ? "保存中..." : "保存する"}
          </button>
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