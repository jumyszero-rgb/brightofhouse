// @/src/app/admin/before-after/edit/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function EditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState({ before: "", after: "" });
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<{ before: string; after: string }>({ before: "", after: "" });

  const [formData, setFormData] = useState({
    title: "",
    beforeDescription: "",
    afterDescription: "",
    date: new Date().toISOString().split('T')[0],
    category: "",
  });
  const [servicePages, setServicePages] = useState<any[]>([]);
  const [servicePageIds, setServicePageIds] = useState<string[]>([]);
  const [servicePageToAdd, setServicePageToAdd] = useState("");

  useEffect(() => {
    fetch("/api/service-pages").then(r => r.json()).then(data => setServicePages(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    if (!editId) return;

    const fetchData = async () => {
      const res = await fetch("/api/before-after");
      const items = await res.json();
      const target = items.find((i: any) => i.id === editId);

      if (target) {
        setServicePageIds((target.servicePages || []).map((sp: any) => sp.id));
        // descriptionを「【ビフォー】」等で分割して復元を試みる（既存データ対応）
        let bDesc = "";
        let aDesc = "";
        if (target.description?.includes("【アフター】")) {
          const parts = target.description.split("【アフター】");
          bDesc = parts[0].replace("【ビフォー】", "").trim();
          aDesc = parts[1].trim();
        } else {
          bDesc = target.description || "";
        }

        setFormData({
          title: target.title,
          beforeDescription: bDesc,
          afterDescription: aDesc,
          date: new Date(target.createdAt).toISOString().split('T')[0],
          category: target.category || "",
        });
        setPreview({
          before: target.beforeUrl,
          after: target.afterUrl,
        });
      }
    };
    fetchData();
  }, [editId]);

  const handleAIGenerate = async () => {
    if (!formData.title || !aiInput.before || !aiInput.after) {
      alert("タイトル、ビフォーの状態、アフターの状態を入力してください。");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/before-after/generate", {
        method: "POST",
        body: JSON.stringify({ title: formData.title, beforeText: aiInput.before, afterText: aiInput.after }),
      });
      const data = await res.json();
      if (data.beforeContent && data.afterContent) {
        setFormData({ 
          ...formData, 
          beforeDescription: data.beforeContent,
          afterDescription: data.afterContent 
        });
      }
    } catch (e) {
      alert("AI生成に失敗しました");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(e.currentTarget);
    if (editId) form.append("id", editId);

    // ビフォーとアフターの説明を結合して送信（DBスキーマ維持のため）
    const combinedDescription = `【ビフォー】\n${formData.beforeDescription}\n\n【アフター】\n${formData.afterDescription}`;
    form.set("description", combinedDescription);
    form.set("category", formData.category);
    form.set("servicePageIds", JSON.stringify(servicePageIds));

    try {
      const method = editId ? "PUT" : "POST";
      const res = await fetch("/api/before-after", { method, body: form });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "エラーが発生しました");
      }

      alert(editId ? "更新しました" : "登録しました");
      router.push("/admin/before-after");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md text-black">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        {editId ? "実績を編集" : "新規登録"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">作業日</label>
            <input
              name="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-2 border rounded text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">タイトル</label>
            <input
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2 border rounded text-black"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">カテゴリ（一覧ページの絞り込みに使用・任意）</label>
          <input
            type="text"
            placeholder="例：水回りクリーニング、ハウスクリーニング、ゴミ屋敷清掃"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full p-2 border rounded text-black"
          />
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3">
          <label className="block text-sm font-bold text-emerald-800">紐付けるサービスページ（複数追加可・任意）</label>
          <p className="text-xs text-emerald-600">
            追加したページの詳細ページに、この実績が縮小表示されます。
          </p>
          {servicePageIds.length > 0 && (
            <ul className="space-y-1">
              {servicePageIds.map((id) => {
                const sp = servicePages.find((s: any) => s.id === id);
                return (
                  <li key={id} className="flex items-center justify-between bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm">
                    <span>{sp?.title || "（読み込み中...）"}</span>
                    <button type="button" onClick={() => setServicePageIds(prev => prev.filter(x => x !== id))} className="text-red-500 text-xs font-bold hover:underline">削除</button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex gap-2">
            <select value={servicePageToAdd} onChange={(e) => setServicePageToAdd(e.target.value)} className="flex-1 p-2 border rounded-lg text-black">
              <option value="">追加するサービスページを選択</option>
              {servicePages.filter((sp: any) => !servicePageIds.includes(sp.id)).map((sp: any) => (
                <option key={sp.id} value={sp.id}>{sp.title}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { if (servicePageToAdd) { setServicePageIds(prev => [...prev, servicePageToAdd]); setServicePageToAdd(""); } }}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700"
            >
              ＋ 追加
            </button>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-4 shadow-inner">
          <h2 className="font-bold text-blue-800 flex items-center gap-2">
            ✨ AIビフォーアフター説明執筆
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-blue-600">ビフォーの状態</label>
              <input
                type="text"
                placeholder="例：カビで真っ黒、水が流れない"
                value={aiInput.before}
                onChange={(e) => setAiInput({ ...aiInput, before: e.target.value })}
                className="w-full p-2 border rounded text-sm text-black"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-blue-600">アフターの状態</label>
              <input
                type="text"
                placeholder="例：新品同様にピカピカ、除菌済み"
                value={aiInput.after}
                onChange={(e) => setAiInput({ ...aiInput, after: e.target.value })}
                className="w-full p-2 border rounded text-sm text-black"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAIGenerate}
            disabled={aiLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-black hover:bg-blue-700 disabled:bg-blue-300 transition-all shadow-md"
          >
            {aiLoading ? "AIが執筆しています..." : "AIで「ビフォ文」「アフター文」を一括生成"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-sm font-black text-slate-700 mb-2">【ビフォ文】</label>
              <textarea
                value={formData.beforeDescription}
                onChange={(e) => setFormData({ ...formData, beforeDescription: e.target.value })}
                rows={6}
                className="w-full p-3 border rounded-lg text-sm leading-relaxed"
                placeholder="作業前の悩みや状態..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Before画像 {editId && <span className="text-red-500 text-xs">(変更時のみ選択)</span>}
              </label>
              {preview.before && (
                <div className="mb-2 relative h-40 w-full bg-gray-100 rounded-lg overflow-hidden border">
                  <Image src={preview.before} alt="before" fill className="object-cover" />
                </div>
              )}
              <input name="beforeImage" type="file" accept="image/*" required={!editId} className="w-full text-xs" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <label className="block text-sm font-black text-blue-900 mb-2">【アフター文】</label>
              <textarea
                value={formData.afterDescription}
                onChange={(e) => setFormData({ ...formData, afterDescription: e.target.value })}
                rows={6}
                className="w-full p-3 border rounded-lg text-sm leading-relaxed"
                placeholder="作業後の変化やプロのこだわり..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                After画像 {editId && <span className="text-red-500 text-xs">(変更時のみ選択)</span>}
              </label>
              {preview.after && (
                <div className="mb-2 relative h-40 w-full bg-gray-100 rounded-lg overflow-hidden border">
                  <Image src={preview.after} alt="after" fill className="object-cover" />
                </div>
              )}
              <input name="afterImage" type="file" accept="image/*" required={!editId} className="w-full text-xs" />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-300 transition-all"
          >
            戻る
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black text-lg hover:bg-blue-700 shadow-lg disabled:bg-blue-300 transition-all"
          >
            {loading ? "保存中..." : (editId ? "更新して保存" : "この実績を公開する")}
          </button>
        </div>
        
        {message && <p className="text-center text-red-600 font-bold animate-bounce">{message}</p>}
      </form>
    </div>
  );
}

export default function EditPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Suspense fallback={<div>読み込み中...</div>}>
        <EditForm />
      </Suspense>
    </div>
  );
}