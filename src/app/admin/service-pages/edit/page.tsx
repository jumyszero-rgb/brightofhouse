// @/src/app/admin/service-pages/edit/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import RichTextEditor from "@/components/RichTextEditor";
import Link from "next/link";

function EditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [loadingSeo, setLoadingSeo] = useState(false);
  const [message, setMessage] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  
  // 選択肢用のサービス項目リスト
  const [serviceItems, setServiceItems] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    slug: "", title: "", linkTitle: "", status: "DRAFT",
    serviceItemId: "", // 追加
    catchphrase: "", content: "", metaKeywords: "", metaDescription: ""
  });

  useEffect(() => {
    // 1. 紐付け用のサービス一覧（中分類）を取得
    fetch("/api/services").then(res => res.json()).then(categories => {
      const allItems = categories.flatMap((cat: any) => cat.items);
      setServiceItems(allItems);
    });

    // 2. 編集データの取得
    if (!editId) return;
    fetch(`/api/service-pages?id=${editId}`)
      .then(res => res.json())
      .then(data => {
        setFormData({
          slug: data.slug, title: data.title, linkTitle: data.linkTitle || "",
          status: data.status, serviceItemId: data.serviceItemId || "",
          catchphrase: data.catchphrase || "",
          content: data.content || "", metaKeywords: data.metaKeywords || "",
          metaDescription: data.metaDescription || ""
        });
        if (data.heroImage) setPreviewImage(data.heroImage);
      });
  }, [editId]);

  const handleSeoSuggest = async () => {
    if (!formData.title || !formData.content) return alert("タイトルと本文を先に入力してください");
    setLoadingSeo(true);
    try {
      const res = await fetch("/api/seo/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formData.title, content: formData.content }),
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, metaKeywords: data.metaKeywords, metaDescription: data.metaDescription }));
      }
    } finally { setLoadingSeo(false); }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    if (editId) form.append("id", editId);
    form.set("content", formData.content);
    form.set("serviceItemId", formData.serviceItemId); // 紐付けIDをセット

    const res = await fetch("/api/service-pages", {
      method: editId ? "PUT" : "POST",
      body: form,
    });

    if (res.ok) {
      alert("保存しました");
      router.push("/admin/service-pages");
    } else {
      const err = await res.json();
      setMessage(`❌ ${err.error || "エラーが発生しました"}`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg text-black">
      <h1 className="text-2xl font-bold mb-6">{editId ? "サービス詳細編集" : "新規サービス詳細作成"}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">ページタイトル(H1)</label>
              <input name="title" required value={formData.title} onChange={(e)=>setFormData({...formData, title:e.target.value})} className="w-full p-2 border rounded" placeholder="例: 浴室クリーニング" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">連動するサービス項目（料金表データ）</label>
              <select 
                value={formData.serviceItemId} 
                onChange={(e)=>setFormData({...formData, serviceItemId:e.target.value})}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">-- 連動させない --</option>
                {serviceItems.map(item => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <label className="block text-sm font-bold mb-1">URL (slug)</label>
              <input name="slug" required value={formData.slug} onChange={(e)=>setFormData({...formData, slug:e.target.value})} className="w-full p-2 border rounded font-mono" placeholder="bathroom-cleaning" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">公開状態</label>
              <select name="status" value={formData.status} onChange={(e)=>setFormData({...formData, status:e.target.value})} className="w-full p-2 border rounded font-bold">
                <option value="DRAFT">下書き</option>
                <option value="PUBLISHED">公開中</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">メイン画像</label>
          {previewImage && <div className="relative h-40 w-full mb-2 rounded overflow-hidden border"><Image src={previewImage} alt="Preview" fill className="object-cover" /></div>}
          <input name="heroImage" type="file" accept="image/*" className="w-full text-sm text-gray-500" />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">キャッチコピー</label>
          <input name="catchphrase" value={formData.catchphrase} onChange={(e)=>setFormData({...formData, catchphrase:e.target.value})} className="w-full p-2 border rounded font-bold text-lg" />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">詳細説明（おすすめ文章・作業手順など）</label>
          <RichTextEditor value={formData.content} onChange={(val) => setFormData({...formData, content: val})} />
        </div>

        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-indigo-900">🔍 SEO設定</h2>
            <button type="button" onClick={handleSeoSuggest} disabled={loadingSeo} className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold">
              {loadingSeo ? "生成中..." : "✨ AIにSEO案を作成させる"}
            </button>
          </div>
          <input name="metaKeywords" value={formData.metaKeywords} onChange={(e)=>setFormData({...formData, metaKeywords:e.target.value})} placeholder="重要キーワード" className="w-full p-2 border rounded" />
          <textarea name="metaDescription" value={formData.metaDescription} onChange={(e)=>setFormData({...formData, metaDescription:e.target.value})} rows={3} placeholder="ディスクリプション" className="w-full p-2 border rounded text-sm" />
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <Link href="/admin/service-pages" className="flex-1 bg-gray-500 text-white py-3 rounded font-bold text-center">キャンセル</Link>
          <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700">
            {loading ? "保存中..." : "詳細ページを保存"}
          </button>
        </div>
        {message && <p className="text-center font-bold text-red-600">{message}</p>}
      </form>
    </div>
  );
}

export default function ServicePageEdit() {
  return (
    <div className="min-h-screen bg-gray-100 p-8"><Suspense fallback={<div>Loading...</div>}><EditForm /></Suspense></div>
  );
}