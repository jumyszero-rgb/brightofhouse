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
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiKeywords, setAiKeywords] = useState("");
  const [message, setMessage] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  
  // 選択肢用のサービス項目リスト
  const [serviceItems, setServiceItems] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    slug: "", title: "", linkTitle: "", status: "DRAFT",
    serviceItemId: "",
    catchphrase: "", content: "", metaKeywords: "", metaDescription: ""
  });

  // ▼ 追加: 予約メニュー用ステート
  const [bookingData, setBookingData] = useState({
    main: { title: "", price: 0, duration: 60 },
    options: [] as { id: string; title: string; price: number; duration: number }[]
  });

  useEffect(() => {
    // 1. 紐付け用のサービス一覧（中分類）を取得
    fetch("/api/services")
      .then(res => res.json())
      .then(categories => {
        const allItems = categories.flatMap((cat: any) => cat.items);
        setServiceItems(allItems);
      });

    // 2. 編集データの取得
    if (!editId) return;
    fetch(`/api/service-pages?id=${editId}`)
      .then(res => res.json())
      .then(data => {
        setFormData({
          slug: data.slug || "",
          title: data.title || "",
          linkTitle: data.linkTitle || "",
          status: data.status || "DRAFT",
          serviceItemId: data.serviceItemId || "",
          catchphrase: data.catchphrase || "",
          content: data.content || "",
          metaKeywords: data.metaKeywords || "",
          metaDescription: data.metaDescription || ""
        });
        if (data.heroImage) setPreviewImage(data.heroImage);
        
        // 予約データの復元
        if (data.bookingData) {
          setBookingData(data.bookingData);
        }
      });
  }, [editId]);

  // オプション操作用
  const addOption = () => setBookingData(prev => ({
    ...prev,
    options: [...prev.options, { id: crypto.randomUUID(), title: "", price: 0, duration: 0 }]
  }));
  const removeOption = (id: string) => setBookingData(prev => ({
    ...prev,
    options: prev.options.filter(o => o.id !== id)
  }));
  const updateOption = (id: string, field: string, value: any) => setBookingData(prev => ({
    ...prev,
    options: prev.options.map(o => o.id === id ? { ...o, [field]: value } : o)
  }));

  const handleAIGenerate = async () => {
    if (!aiKeywords) return alert("キーワードを入力してください（例: エアコンクリーニング 札幌 おすすめ 安い）");
    setLoadingAI(true);
    try {
      const res = await fetch("/api/service-pages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: aiKeywords }),
      });
      if (res.ok) {
        const data = await res.json();
        
        // キー名の揺れを吸収するためのヘルパー
        const getVal = (keys: string[]) => {
          const foundKey = Object.keys(data).find(k => keys.includes(k.toLowerCase()));
          return foundKey ? data[foundKey] : null;
        };

        const title = getVal(["title", "タイトル"]);
        const slug = getVal(["slug", "スラッグ", "url-slug"]);
        const catchphrase = getVal(["catchphrase", "キャッチコピー", "catch_phrase"]);
        const content = getVal(["content", "本文", "body"]);
        const metaDescription = getVal(["metadescription", "description", "説明文"]);
        const metaKeywords = getVal(["metakeywords", "keywords", "キーワード"]);

        setFormData(prev => ({
          ...prev,
          title: title || prev.title,
          slug: slug || prev.slug,
          catchphrase: catchphrase || prev.catchphrase,
          content: content || prev.content,
          metaKeywords: metaKeywords || prev.metaKeywords,
          metaDescription: metaDescription || prev.metaDescription,
          linkTitle: (title || "").substring(0, 10) || prev.linkTitle
        }));
        
        alert("AIによる構成案を反映しました。内容を確認してください。");
      } else {
        const err = await res.json();
        alert("AI生成エラー: " + (err.error || "Unknown error"));
      }
    } catch (e) {
      alert("AI生成に失敗しました");
    } finally {
      setLoadingAI(false);
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
    form.set("serviceItemId", formData.serviceItemId);
    form.set("bookingData", JSON.stringify(bookingData)); // 追加

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
      
      {/* ✨ AIアシスタントセクション */}
      <div className="mb-10 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100 shadow-inner">
        <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
          ✨ AIページ作成アシスタント
        </h2>
        <div className="flex gap-4">
          <input 
            type="text" 
            value={aiKeywords} 
            onChange={(e)=>setAiKeywords(e.target.value)} 
            placeholder="キーワードを入力（例：エアコンクリーニング 札幌 おすすめ 安い）" 
            className="flex-1 p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button 
            type="button" 
            onClick={handleAIGenerate} 
            disabled={loadingAI} 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow-md"
          >
            {loadingAI ? "AI執筆中..." : "構成案を生成"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">ページタイトル(H1)</label>
              <input 
                name="title" 
                required 
                value={formData.title} 
                onChange={(e)=>setFormData(prev => ({...prev, title:e.target.value}))} 
                className="w-full p-2 border rounded" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">連動するサービス項目</label>
              <select 
                value={formData.serviceItemId} 
                onChange={(e)=>setFormData(prev => ({...prev, serviceItemId:e.target.value}))}
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
              <input 
                name="slug" 
                required 
                value={formData.slug} 
                onChange={(e)=>setFormData(prev => ({...prev, slug:e.target.value}))} 
                className="w-full p-2 border rounded font-mono" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">公開状態</label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={(e)=>setFormData(prev => ({...prev, status:e.target.value}))} 
                className="w-full p-2 border rounded font-bold"
              >
                <option value="DRAFT">下書き</option>
                <option value="PUBLISHED">公開中</option>
              </select>
            </div>
          </div>
        </div>

        {/* ▼ 追加: 予約メニュー設定セクション */}
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 space-y-4">
          <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
            📅 このページの予約メニュー設定
          </h2>
          
          {/* メインメニュー */}
          <div className="bg-white p-4 rounded-lg border border-emerald-200 shadow-sm space-y-4">
            <p className="text-sm font-bold text-emerald-700 border-b pb-2">メインサービスの設定</p>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-6">
                <label className="block text-[10px] font-bold text-gray-400 mb-1">サービス名</label>
                <input 
                  placeholder="例: 浴室全体清掃" 
                  value={bookingData.main.title} 
                  onChange={(e) => setBookingData({...bookingData, main: {...bookingData.main, title: e.target.value}})}
                  className="w-full p-2 border rounded text-sm bg-slate-50"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-gray-400 mb-1">価格 (円)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={bookingData.main.price || ""} 
                    onChange={(e) => setBookingData({...bookingData, main: {...bookingData.main, price: Number(e.target.value)}})}
                    className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-2 text-xs text-gray-400">円</span>
                </div>
              </div>
              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-gray-400 mb-1">作業時間 (分)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={bookingData.main.duration || ""} 
                    onChange={(e) => setBookingData({...bookingData, main: {...bookingData.main, duration: Number(e.target.value)}})}
                    className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-2 text-xs text-gray-400">分</span>
                </div>
              </div>
            </div>
          </div>

          {/* オプションリスト */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-emerald-700">追加オプション</p>
              <button type="button" onClick={addOption} className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-full font-bold hover:bg-emerald-700 transition-colors">
                ＋ オプションを追加
              </button>
            </div>
            {bookingData.options.map((opt) => (
              <div key={opt.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-3 rounded-lg border border-emerald-100 shadow-sm items-end">
                <div className="md:col-span-5">
                  <label className="block text-[10px] font-bold text-gray-300 mb-1">オプション名</label>
                  <input 
                    placeholder="例: 鏡のウロコ取り" 
                    value={opt.title} 
                    onChange={(e) => updateOption(opt.id, "title", e.target.value)}
                    className="w-full p-2 border rounded text-xs"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-gray-300 mb-1">追加料金 (円)</label>
                  <input 
                    type="number" 
                    value={opt.price || ""} 
                    onChange={(e) => updateOption(opt.id, "price", Number(e.target.value))}
                    className="w-full p-2 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-gray-300 mb-1">追加時間 (分)</label>
                  <input 
                    type="number" 
                    value={opt.duration || ""} 
                    onChange={(e) => updateOption(opt.id, "duration", Number(e.target.value))}
                    className="w-full p-2 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="md:col-span-1 text-right">
                  <button type="button" onClick={() => removeOption(opt.id)} className="text-red-500 text-xs font-bold hover:underline mb-2">
                    削除
                  </button>
                </div>
              </div>
            ))}
            {bookingData.options.length === 0 && <p className="text-center text-xs text-emerald-400 py-2">オプションは設定されていません</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">メイン画像</label>
          {previewImage && <div className="relative h-40 w-full mb-2 rounded overflow-hidden border"><Image src={previewImage} alt="Preview" fill className="object-cover" /></div>}
          <input name="heroImage" type="file" accept="image/*" className="w-full text-sm text-gray-500" />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">キャッチコピー</label>
          <input 
            name="catchphrase" 
            value={formData.catchphrase} 
            onChange={(e)=>setFormData(prev => ({...prev, catchphrase:e.target.value}))} 
            className="w-full p-2 border rounded font-bold text-lg" 
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">詳細説明</label>
          <RichTextEditor value={formData.content} onChange={(val) => setFormData(prev => ({...prev, content: val}))} />
        </div>

        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-indigo-900">🔍 SEO設定</h2>
            <button type="button" onClick={handleSeoSuggest} disabled={loadingSeo} className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold">
              {loadingSeo ? "生成中..." : "✨ AIにSEO案を作成させる"}
            </button>
          </div>
          <input 
            name="metaKeywords" 
            value={formData.metaKeywords} 
            onChange={(e)=>setFormData(prev => ({...prev, metaKeywords:e.target.value}))} 
            className="w-full p-2 border rounded" 
          />
          <textarea 
            name="metaDescription" 
            value={formData.metaDescription} 
            onChange={(e)=>setFormData(prev => ({...prev, metaDescription:e.target.value}))} 
            rows={3} 
            className="w-full p-2 border rounded text-sm" 
          />
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
    <div className="min-h-screen bg-gray-100 p-8">
      <Suspense fallback={<div>Loading...</div>}>
        <EditForm />
      </Suspense>
    </div>
  );
}