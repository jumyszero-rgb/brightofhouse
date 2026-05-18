// @/src/app/admin/service-pages/edit/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import RichTextEditor from "@/components/RichTextEditor";
import Link from "next/link";

type FoldItem = {
  id: string;
  title: string;
  price: number;
  durationMin: number;
  durationMax: number;
  comment: string;
  cautionNote: string;
};

type OptionItem = {
  id: string;
  title: string;
  price: number;
  durationMin: number;
  durationMax: number;
  maxQty: number;
  comment: string;
  parentFoldItemId?: string; // どのfoldItemに紐づくか
};

type DiscountRule = {
  count: number; // 2〜10
  value: number; // 金額 or パーセント
};

type SetDiscount = {
  enabled: boolean;
  type: "amount" | "percent"; // 円引き or %引き
  rules: DiscountRule[];
};

type MainService = {
  id: string;
  title: string;
  price: number;
  durationMin: number;
  durationMax: number;
  foldTitle: string;
  foldItems: FoldItem[];
  options: OptionItem[];
  setDiscount: SetDiscount;
};

// 旧型（後方互換用）
type LegacyOptionService = {
  id: string;
  title: string;
  price: number;
  durationMin: number;
  durationMax: number;
  maxQty: number;
  foldTitle: string;
  foldItems: FoldItem[];
};

function newFoldItem(): FoldItem {
  return { id: crypto.randomUUID(), title: "", price: 0, durationMin: 0, durationMax: 0, comment: "", cautionNote: "" };
}


function newOptionItem(parentFoldItemId?: string): OptionItem {
  return { id: crypto.randomUUID(), title: "", price: 0, durationMin: 0, durationMax: 0, maxQty: 1, comment: "", parentFoldItemId };
}

function newSetDiscount(): SetDiscount {
  return { enabled: false, type: "amount", rules: [] };
}

function newMain(): MainService {
  return { id: crypto.randomUUID(), title: "", price: 0, durationMin: 60, durationMax: 60, foldTitle: "", foldItems: [], options: [], setDiscount: newSetDiscount() };
}

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
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyPages, setCopyPages] = useState<any[]>([]);
  const [serviceItems, setServiceItems] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    slug: "", title: "", linkTitle: "", status: "DRAFT",
    serviceItemId: "", catchphrase: "", content: "", metaKeywords: "", metaDescription: "", noIndex: false, canonicalUrl: "", redirectUrl: ""
  });

  const [bookingData, setBookingData] = useState<{ mains: MainService[]; legacyOptions?: LegacyOptionService[] }>({
    mains: [newMain()],
  });

  useEffect(() => {
    fetch("/api/service-items").then(r => r.json()).then(setServiceItems).catch(() => {});
  }, []);

  useEffect(() => {
    if (!editId) return;
    fetch(`/api/service-pages?id=${editId}`).then(r => r.json()).then(data => {
      setFormData({
        slug: data.slug || "", title: data.title || "", linkTitle: data.linkTitle || "",
        status: data.status || "DRAFT", serviceItemId: data.serviceItemId || "",
        catchphrase: data.catchphrase || "", content: data.content || "",
        metaKeywords: data.metaKeywords || "", metaDescription: data.metaDescription || "",
                noIndex: data.noIndex || false, canonicalUrl: data.canonicalUrl || "", redirectUrl: data.redirectUrl || ""

      });
      if (data.heroImage) setPreviewImage(data.heroImage);

      const bd = data.bookingData;
      if (!bd) return;

      // 新形式（mains[].options, mains[].setDiscount が存在する）
      if (bd.mains && bd.mains[0]?.setDiscount !== undefined) {
        setBookingData({
          mains: bd.mains.map((m: any) => ({
            ...m,
            foldTitle: m.foldTitle || "",
            foldItems: (m.foldItems || []).map((fi: any) => ({ ...fi, id: fi.id || crypto.randomUUID(), comment: fi.comment || "" })),
            options: (m.options || []).map((o: any) => ({ ...o, id: o.id || crypto.randomUUID(), comment: o.comment || "" })),
            setDiscount: m.setDiscount || newSetDiscount(),
          })),
        });
      }
      // 旧形式（独立 options がある）→ 後方互換で読み込み
      else if (bd.mains) {
        const legacyOpts: LegacyOptionService[] = (bd.options || []).map((o: any) => ({
          ...o,
          id: o.id || crypto.randomUUID(),
          maxQty: o.maxQty || 1,
          foldTitle: o.foldTitle || "",
          foldItems: (o.foldItems || []).map((fi: any) => ({ ...fi, id: fi.id || crypto.randomUUID(), comment: fi.comment || "" }))
        }));
        setBookingData({
          mains: (bd.mains || []).map((m: any) => ({
            ...m,
            foldTitle: m.foldTitle || "",
            foldItems: (m.foldItems || []).map((fi: any) => ({ ...fi, id: fi.id || crypto.randomUUID(), comment: fi.comment || "" })),
            options: [],
            setDiscount: newSetDiscount(),
          })),
          legacyOptions: legacyOpts,
        });
      }
      // 最旧形式（main 単数）
      else if (bd.main) {
        setBookingData({
          mains: [{
            ...newMain(),
            title: bd.main.title || "",
            price: bd.main.price || 0,
            durationMin: bd.main.duration || bd.main.durationMin || 60,
            durationMax: bd.main.duration || bd.main.durationMax || 60,
          }],
        });
      }
    });
  }, [editId]);

  // ===== Main CRUD =====
  const moveMain = (idx: number, dir: number) => setBookingData(prev => {
    const arr = [...prev.mains]; const t = arr[idx]; arr[idx] = arr[idx + dir]; arr[idx + dir] = t;
    return { ...prev, mains: arr };
  });
  const addMain = () => setBookingData(prev => ({ ...prev, mains: [...prev.mains, newMain()] }));
  const removeMain = (id: string) => setBookingData(prev => ({ ...prev, mains: prev.mains.filter(m => m.id !== id) }));
  const updateMain = (id: string, field: string, value: any) => setBookingData(prev => ({
    ...prev, mains: prev.mains.map(m => m.id === id ? { ...m, [field]: value } : m)
  }));

  // ===== FoldItem CRUD =====
  const addMainFoldItem = (mainId: string) => setBookingData(prev => ({
    ...prev, mains: prev.mains.map(m => m.id === mainId ? { ...m, foldItems: [...m.foldItems, newFoldItem()] } : m)
  }));
  const removeMainFoldItem = (mainId: string, fiId: string) => setBookingData(prev => ({
    ...prev, mains: prev.mains.map(m => m.id === mainId ? {
      ...m,
      foldItems: m.foldItems.filter(fi => fi.id !== fiId),
      options: m.options.filter(o => o.parentFoldItemId !== fiId), // 紐づくオプションも削除
    } : m)
  }));
  const updateMainFoldItem = (mainId: string, fiId: string, field: string, value: any) => setBookingData(prev => ({
    ...prev, mains: prev.mains.map(m => m.id === mainId ? {
      ...m, foldItems: m.foldItems.map(fi => fi.id === fiId ? { ...fi, [field]: value } : fi)
    } : m)
  }));

  // ===== Option CRUD (メイン配下) =====
  const addMainOption = (mainId: string, parentFoldItemId?: string) => setBookingData(prev => ({
    ...prev, mains: prev.mains.map(m => m.id === mainId ? { ...m, options: [...m.options, newOptionItem(parentFoldItemId)] } : m)
  }));
  const removeMainOption = (mainId: string, optId: string) => setBookingData(prev => ({
    ...prev, mains: prev.mains.map(m => m.id === mainId ? { ...m, options: m.options.filter(o => o.id !== optId) } : m)
  }));
  const updateMainOption = (mainId: string, optId: string, field: string, value: any) => setBookingData(prev => ({
    ...prev, mains: prev.mains.map(m => m.id === mainId ? {
      ...m, options: m.options.map(o => o.id === optId ? { ...o, [field]: value } : o)
    } : m)
  }));

  // ===== SetDiscount =====
  const updateSetDiscount = (mainId: string, discount: SetDiscount) => setBookingData(prev => ({
    ...prev, mains: prev.mains.map(m => m.id === mainId ? { ...m, setDiscount: discount } : m)
  }));
  const addDiscountRule = (mainId: string) => {
    const main = bookingData.mains.find(m => m.id === mainId);
    if (!main) return;
    const nextCount = main.setDiscount.rules.length > 0
      ? Math.min(10, Math.max(...main.setDiscount.rules.map(r => r.count)) + 1)
      : 2;
    if (nextCount > 10) return;
    updateSetDiscount(mainId, {
      ...main.setDiscount,
      rules: [...main.setDiscount.rules, { count: nextCount, value: 0 }]
    });
  };
  const removeDiscountRule = (mainId: string, count: number) => {
    const main = bookingData.mains.find(m => m.id === mainId);
    if (!main) return;
    updateSetDiscount(mainId, {
      ...main.setDiscount,
      rules: main.setDiscount.rules.filter(r => r.count !== count)
    });
  };
  const updateDiscountRule = (mainId: string, count: number, value: number) => {
    const main = bookingData.mains.find(m => m.id === mainId);
    if (!main) return;
    updateSetDiscount(mainId, {
      ...main.setDiscount,
      rules: main.setDiscount.rules.map(r => r.count === count ? { ...r, value } : r)
    });
  };

  // ===== Legacy Options CRUD（後方互換） =====
  const addLegacyOption = () => setBookingData(prev => ({
    ...prev, legacyOptions: [...(prev.legacyOptions || []), { id: crypto.randomUUID(), title: "", price: 0, durationMin: 0, durationMax: 0, maxQty: 1, foldTitle: "", foldItems: [] }]
  }));
  const removeLegacyOption = (id: string) => setBookingData(prev => ({
    ...prev, legacyOptions: (prev.legacyOptions || []).filter(o => o.id !== id)
  }));
  const updateLegacyOption = (id: string, field: string, value: any) => setBookingData(prev => ({
    ...prev, legacyOptions: (prev.legacyOptions || []).map(o => o.id === id ? { ...o, [field]: value } : o)
  }));
  const addLegacyOptionFoldItem = (optId: string) => setBookingData(prev => ({
    ...prev, legacyOptions: (prev.legacyOptions || []).map(o => o.id === optId ? { ...o, foldItems: [...o.foldItems, newFoldItem()] } : o)
  }));
  const removeLegacyOptionFoldItem = (optId: string, fiId: string) => setBookingData(prev => ({
    ...prev, legacyOptions: (prev.legacyOptions || []).map(o => o.id === optId ? { ...o, foldItems: o.foldItems.filter(fi => fi.id !== fiId) } : o)
  }));
  const updateLegacyOptionFoldItem = (optId: string, fiId: string, field: string, value: any) => setBookingData(prev => ({
    ...prev, legacyOptions: (prev.legacyOptions || []).map(o => o.id === optId ? {
      ...o, foldItems: o.foldItems.map(fi => fi.id === fiId ? { ...fi, [field]: value } : fi)
    } : o)
  }));

  // ===== Copy from other page =====
  const openCopyModal = async () => {
    const res = await fetch("/api/service-pages?all=true");
    const pages = await res.json();
    setCopyPages(pages.filter((p: any) => p.id !== editId));
    setShowCopyModal(true);
  };
  const copyFrom = (page: any) => {
    if (!page.bookingData) return alert("この記事には予約メニューがありません");
    const bd = page.bookingData;
    const copiedMains = (bd.mains || []).map((m: any) => ({
      ...m, id: crypto.randomUUID(),
      foldTitle: m.foldTitle || "",
      foldItems: (m.foldItems || []).map((fi: any) => ({ ...fi, id: crypto.randomUUID() })),
      options: (m.options || []).map((o: any) => ({ ...o, id: crypto.randomUUID() })),
      setDiscount: m.setDiscount || newSetDiscount(),
    }));
    setBookingData(prev => ({
      ...prev,
      mains: [...prev.mains, ...copiedMains],
    }));
    setShowCopyModal(false);
    setMessage("コピーしました");
  };
  // AI generate
  const handleAIGenerate = async () => {
    if (!aiKeywords.trim()) return alert("キーワードを入力してください");
    setLoadingAI(true);
    try {
      const res = await fetch("/api/service-pages/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keywords: aiKeywords }) });
      if (!res.ok) throw new Error("生成失敗");
      const data = await res.json();
      const getVal = (keys: string[]) => {
        for (const k of keys) { for (const dk of Object.keys(data)) { if (dk.toLowerCase() === k.toLowerCase()) return data[dk]; } } return "";
      };
      const title = getVal(["title", "タイトル", "pageTitle"]);
      const slug = getVal(["slug", "スラッグ", "url-slug"]);
      const catchphrase = getVal(["catchphrase", "キャッチコピー", "catchCopy"]);
      const content = getVal(["content", "本文", "body", "description"]);
      const metaDescription = getVal(["metaDescription", "meta_description", "SEO説明"]);
      const metaKeywords = getVal(["metaKeywords", "meta_keywords", "SEOキーワード"]);
      setFormData(prev => ({
        ...prev,
        ...(title && { title }), ...(slug && { slug }), ...(catchphrase && { catchphrase }),
        ...(content && { content }), ...(metaDescription && { metaDescription }), ...(metaKeywords && { metaKeywords }),
        linkTitle: (title || "").substring(0, 10) || prev.linkTitle
      }));
      setMessage("AI生成完了！内容を確認してください。");
    } catch (e: any) { alert(e.message); } finally { setLoadingAI(false); }
  };

  // SEO suggest
  const handleSeoSuggest = async () => {
    setLoadingSeo(true);
    try {
      const res = await fetch("/api/seo/suggest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: formData.title, content: formData.content }) });
      const data = await res.json();
      if (data.metaDescription) setFormData(prev => ({ ...prev, metaDescription: data.metaDescription }));
      if (data.metaKeywords) setFormData(prev => ({ ...prev, metaKeywords: data.metaKeywords }));
    } catch {} finally { setLoadingSeo(false); }
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.title) return alert("タイトルを入力してください");
    setLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      if (editId) form.set("id", editId);
      form.set("title", formData.title);
      form.set("slug", formData.slug);
      form.set("linkTitle", formData.linkTitle);
      form.set("status", formData.status);
      form.set("serviceItemId", formData.serviceItemId);
      form.set("catchphrase", formData.catchphrase);
      form.set("content", formData.content);
      form.set("metaKeywords", formData.metaKeywords);
      form.set("metaDescription", formData.metaDescription);
      form.set("noIndex", String(formData.noIndex));
      form.set("canonicalUrl", formData.canonicalUrl);
      form.set("redirectUrl", formData.redirectUrl);


      // 保存時は legacyOptions を options として含める（後方互換）
      const saveData: any = { mains: bookingData.mains };
      if (bookingData.legacyOptions && bookingData.legacyOptions.length > 0) {
        saveData.options = bookingData.legacyOptions;
      }
      form.set("bookingData", JSON.stringify(saveData));

      const res = await fetch("/api/service-pages", { method: editId ? "PUT" : "POST", body: form });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "保存失敗");
      router.push("/admin/service-pages");
    } catch (e: any) { setMessage(e.message); } finally { setLoading(false); }
  };

  // ===== Render helpers =====
  const renderFoldItemRow = (fi: FoldItem, mainId: string, idx: number) => (
    <div key={fi.id} className="bg-amber-50 p-3 rounded border border-amber-200 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-amber-700">メニュー {idx + 1}</span>
        <button type="button" onClick={() => removeMainFoldItem(mainId, fi.id)} className="text-red-500 text-xs font-bold hover:underline">削除</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
        <div className="md:col-span-4">
          <label className="block text-[10px] font-bold text-amber-600 mb-1">メニュー名</label>
          <input placeholder="例: キッチンクリーニング" value={fi.title} onChange={e => updateMainFoldItem(mainId, fi.id, "title", e.target.value)} className="w-full p-2 border rounded text-sm" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-amber-600 mb-1">価格(円)</label>
          <input type="number" value={fi.price || ""} onChange={e => updateMainFoldItem(mainId, fi.id, "price", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
        <div className="md:col-span-3">
          <label className="block text-[10px] font-bold text-amber-600 mb-1">最短(分)</label>
          <input type="number" value={fi.durationMin || ""} onChange={e => updateMainFoldItem(mainId, fi.id, "durationMin", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
        <div className="md:col-span-3">
          <label className="block text-[10px] font-bold text-amber-600 mb-1">最長(分)</label>
          <input type="number" value={fi.durationMax || ""} onChange={e => updateMainFoldItem(mainId, fi.id, "durationMax", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-amber-600 mb-1">コメント（任意）</label>
        <input placeholder="例: 6回分チケット購入が必要" value={fi.comment || ""} onChange={e => updateMainFoldItem(mainId, fi.id, "comment", e.target.value)} className="w-full p-2 border rounded text-sm bg-white" />
      </div>
      {/* 折り畳み注意事項 */}
      <div>
        <label className="block text-[10px] font-bold text-red-600 mb-1">⚠️ 注意事項（折り畳み表示・任意）</label>
        <textarea
          placeholder="例: ※当サービスは詰まり解消作業には対応しておりません。詰まりの場合は専門業者へご依頼ください。"
          value={fi.cautionNote || ""}
          onChange={e => updateMainFoldItem(mainId, fi.id, "cautionNote", e.target.value)}
          rows={3}
          className="w-full p-2 border rounded text-sm bg-red-50 border-red-200"
        />
      </div>


      {/* このメニューに紐づくオプション */}
      <div className="mt-2 pl-4 border-l-4 border-indigo-200 space-y-2">
        <p className="text-[10px] font-bold text-indigo-600">┗ オプション（{fi.title || "このメニュー"}に紐づく）</p>
        {bookingData.mains.find(m => m.id === mainId)?.options.filter(o => o.parentFoldItemId === fi.id).map((opt, oIdx) => (
          <div key={opt.id} className="bg-indigo-50 p-2 rounded border border-indigo-200 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-indigo-500">オプション {oIdx + 1}</span>
              <button type="button" onClick={() => removeMainOption(mainId, opt.id)} className="text-red-500 text-[10px] font-bold hover:underline">削除</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-1 items-end">
              <div className="md:col-span-3">
                <input placeholder="オプション名" value={opt.title} onChange={e => updateMainOption(mainId, opt.id, "title", e.target.value)} className="w-full p-1.5 border rounded text-xs" />
              </div>
              <div className="md:col-span-2">
                <input type="number" placeholder="価格" value={opt.price || ""} onChange={e => updateMainOption(mainId, opt.id, "price", Number(e.target.value))} className="w-full p-1.5 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div className="md:col-span-2">
                <input type="number" placeholder="最短(分)" value={opt.durationMin || ""} onChange={e => updateMainOption(mainId, opt.id, "durationMin", Number(e.target.value))} className="w-full p-1.5 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div className="md:col-span-2">
                <input type="number" placeholder="最長(分)" value={opt.durationMax || ""} onChange={e => updateMainOption(mainId, opt.id, "durationMax", Number(e.target.value))} className="w-full p-1.5 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div className="md:col-span-1">
                <input type="number" placeholder="最大数" min={1} value={opt.maxQty || 1} onChange={e => updateMainOption(mainId, opt.id, "maxQty", Math.max(1, Number(e.target.value)))} className="w-full p-1.5 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div className="md:col-span-2">
                <input placeholder="コメント" value={opt.comment || ""} onChange={e => updateMainOption(mainId, opt.id, "comment", e.target.value)} className="w-full p-1.5 border rounded text-xs" />
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => addMainOption(mainId, fi.id)} className="text-[10px] bg-indigo-500 text-white px-2 py-1 rounded-full font-bold hover:bg-indigo-600">＋ オプション追加</button>
      </div>
    </div>
  );

  const renderSetDiscountUI = (main: MainService) => (
    <div className="bg-green-50 p-3 rounded-lg border border-green-200 space-y-3">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={main.setDiscount.enabled} onChange={() => updateSetDiscount(main.id, { ...main.setDiscount, enabled: !main.setDiscount.enabled })} className="w-4 h-4 accent-green-600" />
          <span className="text-sm font-bold text-green-800">セット値引きを有効にする</span>
        </label>
      </div>
      {main.setDiscount.enabled && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-green-700">値引き方式：</label>
            <select value={main.setDiscount.type} onChange={e => updateSetDiscount(main.id, { ...main.setDiscount, type: e.target.value as "amount" | "percent" })} className="p-1 border rounded text-xs">
              <option value="amount">円引き（合計から○円引き）</option>
              <option value="percent">%引き（合計から○%引き）</option>
            </select>
          </div>
          <div className="space-y-1">
            {main.setDiscount.rules.sort((a, b) => a.count - b.count).map(rule => (
              <div key={rule.count} className="flex items-center gap-2">
                <span className="text-xs font-bold text-green-700 w-16">{rule.count}点選択：</span>
                <input type="number" value={rule.value || ""} onChange={e => updateDiscountRule(main.id, rule.count, Number(e.target.value))} className="w-24 p-1 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <span className="text-xs text-green-600">{main.setDiscount.type === "amount" ? "円引き" : "%引き"}</span>
                <button type="button" onClick={() => removeDiscountRule(main.id, rule.count)} className="text-red-500 text-[10px] font-bold hover:underline">削除</button>
              </div>
            ))}
          </div>
          {main.setDiscount.rules.length < 9 && (
            <button type="button" onClick={() => addDiscountRule(main.id)} className="text-[10px] bg-green-600 text-white px-2 py-1 rounded-full font-bold hover:bg-green-700">＋ 値引きルール追加</button>
          )}
        </div>
      )}
    </div>
  );

  // ===== Legacy option render =====
  const renderLegacyFoldItemRow = (fi: FoldItem, optId: string, idx: number) => (
    <div key={fi.id} className="bg-amber-50 p-3 rounded border border-amber-200 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-amber-700">プラン {idx + 1}</span>
        <button type="button" onClick={() => removeLegacyOptionFoldItem(optId, fi.id)} className="text-red-500 text-xs font-bold hover:underline">削除</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
        <div className="md:col-span-4">
          <input placeholder="プラン名" value={fi.title} onChange={e => updateLegacyOptionFoldItem(optId, fi.id, "title", e.target.value)} className="w-full p-2 border rounded text-sm" />
        </div>
        <div className="md:col-span-2">
          <input type="number" placeholder="価格" value={fi.price || ""} onChange={e => updateLegacyOptionFoldItem(optId, fi.id, "price", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
        <div className="md:col-span-3">
          <input type="number" placeholder="最短(分)" value={fi.durationMin || ""} onChange={e => updateLegacyOptionFoldItem(optId, fi.id, "durationMin", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
        <div className="md:col-span-3">
          <input type="number" placeholder="最長(分)" value={fi.durationMax || ""} onChange={e => updateLegacyOptionFoldItem(optId, fi.id, "durationMax", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
      </div>
      <input placeholder="コメント" value={fi.comment || ""} onChange={e => updateLegacyOptionFoldItem(optId, fi.id, "comment", e.target.value)} className="w-full p-2 border rounded text-sm bg-white" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 text-black bg-white min-h-screen">
      <h1 className="text-2xl font-bold">{editId ? "サービス詳細ページ編集" : "新規サービス詳細ページ"}</h1>

      {/* AI assistant */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
        <p className="text-sm font-bold text-indigo-700 mb-2">✨ AIページ作成アシスタント</p>
        <div className="flex gap-2">
          <input placeholder="キーワードを入力（例：エアコンクリーニング 札幌 おすすめ 安い）" value={aiKeywords} onChange={e => setAiKeywords(e.target.value)} className="flex-1 p-2 border rounded text-sm" />
          <button type="button" onClick={handleAIGenerate} disabled={loadingAI} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-indigo-700 disabled:opacity-50">{loadingAI ? "生成中..." : "構成案を生成"}</button>
        </div>
      </div>

      {/* Basic info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1">ページタイトル(H1)</label>
          <input value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} className="w-full p-3 border rounded-lg text-lg" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">連動するサービス項目</label>
          <select value={formData.serviceItemId} onChange={e => setFormData(prev => ({ ...prev, serviceItemId: e.target.value }))} className="w-full p-3 border rounded-lg">
            <option value="">（選択しない）</option>
            {serviceItems.map((item: any) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">一覧ページのボタン表示名</label>
          <input value={formData.linkTitle} onChange={e => setFormData(prev => ({ ...prev, linkTitle: e.target.value }))} placeholder="例: 浴室クリーニング（空欄時はタイトルを使用）" className="w-full p-3 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">URL (slug)</label>
          <input value={formData.slug} onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))} className="w-full p-3 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">公開状態</label>
          <select value={formData.status} onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full p-3 border rounded-lg">
            <option value="DRAFT">下書き</option>
            <option value="PUBLISHED">公開</option>
          </select>
          <label className="flex items-center gap-2 text-sm font-bold text-red-700 cursor-pointer mt-3">
            <input type="checkbox" checked={formData.noIndex} onChange={() => setFormData(prev => ({ ...prev, noIndex: !prev.noIndex }))} className="w-5 h-5 accent-red-600" />
            インデックスしない（noindex）
          </label>
        </div>
      </div>

      {/* ===== Booking data ===== */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-emerald-800">📅 このページの予約メニュー設定</h2>
          <button type="button" onClick={openCopyModal} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full font-bold hover:bg-blue-600">📋 他ページからコピー</button>
        </div>

        {/* メインサービス */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm font-bold text-emerald-700 border-b pb-2">メインサービスの設定</p>
            <button type="button" onClick={addMain} className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-full font-bold hover:bg-emerald-700">＋ メインサービスを追加</button>
          </div>
          {bookingData.mains.map((main, idx) => (
            <div key={main.id} className="bg-white p-4 rounded-lg border border-emerald-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => moveMain(idx, -1)} disabled={idx === 0} className="text-xs px-2 py-1 bg-slate-200 rounded disabled:opacity-30 font-bold">▲</button>
                  <button type="button" onClick={() => moveMain(idx, 1)} disabled={idx === bookingData.mains.length - 1} className="text-xs px-2 py-1 bg-slate-200 rounded disabled:opacity-30 font-bold">▼</button>
                  <p className="text-xs font-bold text-emerald-600">メインサービス {idx + 1}</p>
                </div>
                {bookingData.mains.length > 1 && (
                  <button type="button" onClick={() => removeMain(main.id)} className="text-red-500 text-xs font-bold hover:underline">削除</button>
                )}
              </div>

              {/* 折り畳みタイトル */}
              <div>
                <label className="block text-[10px] font-bold text-amber-600 mb-1">▼ 折り畳みタイトル（入力すると折り畳みグループになります）</label>
                <input placeholder="例: 水回りクリーニング（空欄 = 折り畳みなし）" value={main.foldTitle} onChange={e => updateMain(main.id, "foldTitle", e.target.value)} className="w-full p-2 border rounded text-sm bg-amber-50" />
              </div>

              {/* 折り畳みなし → 通常の単体表示 */}
              {!main.foldTitle && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">サービス名</label>
                    <input placeholder="例: 浴室全体清掃" value={main.title} onChange={e => updateMain(main.id, "title", e.target.value)} className="w-full p-2 border rounded text-sm bg-slate-50" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">価格(円)</label>
                    <input type="number" value={main.price || ""} onChange={e => updateMain(main.id, "price", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">最短(分)</label>
                    <input type="number" value={main.durationMin || ""} onChange={e => updateMain(main.id, "durationMin", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">最長(分)</label>
                    <input type="number" value={main.durationMax || ""} onChange={e => updateMain(main.id, "durationMax", Number(e.target.value))} className="w-full p-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                </div>
              )}

              {/* 折り畳みあり → 中にメニュー + オプション + セット値引き */}
              {main.foldTitle && (
                <div className="space-y-3 pl-4 border-l-4 border-amber-300">
                  {main.foldItems.map((fi, fiIdx) => renderFoldItemRow(fi, main.id, fiIdx))}
                  <button type="button" onClick={() => addMainFoldItem(main.id)} className="text-xs bg-amber-500 text-white px-3 py-1 rounded-full font-bold hover:bg-amber-600">＋ メニューを追加</button>

                  {/* セット値引き設定 */}
                  {main.foldItems.length >= 2 && renderSetDiscountUI(main)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 旧オプション（後方互換：既存データがある場合のみ表示） */}
        {bookingData.legacyOptions && bookingData.legacyOptions.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-orange-700">追加オプション（旧形式）</p>
                <p className="text-[10px] text-orange-500">※新しいメインサービスのオプションに移行することを推奨します</p>
              </div>
              <button type="button" onClick={addLegacyOption} className="text-xs bg-orange-500 text-white px-3 py-1 rounded-full font-bold hover:bg-orange-600">＋ 旧オプション追加</button>
            </div>
            {bookingData.legacyOptions.map((opt, idx) => (
              <div key={opt.id} className="bg-white p-3 rounded-lg border border-orange-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-orange-600 font-bold">旧オプション {idx + 1}</span>
                  <button type="button" onClick={() => removeLegacyOption(opt.id)} className="text-red-500 text-xs font-bold hover:underline">削除</button>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-600 mb-1">▼ 折り畳みタイトル</label>
                  <input placeholder="例: キッチンのオプション" value={opt.foldTitle} onChange={e => updateLegacyOption(opt.id, "foldTitle", e.target.value)} className="w-full p-2 border rounded text-xs bg-amber-50" />
                </div>
                {!opt.foldTitle && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-3">
                      <input placeholder="オプション名" value={opt.title} onChange={e => updateLegacyOption(opt.id, "title", e.target.value)} className="w-full p-2 border rounded text-xs" />
                    </div>
                    <div className="md:col-span-2">
                      <input type="number" placeholder="価格" value={opt.price || ""} onChange={e => updateLegacyOption(opt.id, "price", Number(e.target.value))} className="w-full p-2 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    </div>
                    <div className="md:col-span-2">
                      <input type="number" placeholder="最短(分)" value={opt.durationMin || ""} onChange={e => updateLegacyOption(opt.id, "durationMin", Number(e.target.value))} className="w-full p-2 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    </div>
                    <div className="md:col-span-2">
                      <input type="number" placeholder="最長(分)" value={opt.durationMax || ""} onChange={e => updateLegacyOption(opt.id, "durationMax", Number(e.target.value))} className="w-full p-2 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    </div>
                    <div className="md:col-span-2">
                      <input type="number" placeholder="最大数" min={1} value={opt.maxQty || 1} onChange={e => updateLegacyOption(opt.id, "maxQty", Math.max(1, Number(e.target.value)))} className="w-full p-2 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    </div>
                  </div>
                )}
                {opt.foldTitle && (
                  <div className="space-y-3 pl-4 border-l-4 border-amber-300">
                    <div className="mb-2">
                      <label className="block text-[10px] font-bold text-gray-300 mb-1">最大個数（グループ全体）</label>
                      <input type="number" min={1} value={opt.maxQty || 1} onChange={e => updateLegacyOption(opt.id, "maxQty", Math.max(1, Number(e.target.value)))} className="w-24 p-2 border rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    </div>
                    {opt.foldItems.map((fi, fiIdx) => renderLegacyFoldItemRow(fi, opt.id, fiIdx))}
                    <button type="button" onClick={() => addLegacyOptionFoldItem(opt.id)} className="text-xs bg-amber-500 text-white px-3 py-1 rounded-full font-bold hover:bg-amber-600">＋ プランを追加</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image / Catch / Content */}
      <div>
        <label className="block text-sm font-bold mb-1">メイン画像</label>
        {previewImage && <div className="relative h-40 w-full mb-2 rounded overflow-hidden border"><Image src={previewImage} alt="Preview" fill className="object-cover" /></div>}
        <input name="heroImage" type="file" accept="image/*" className="w-full text-sm text-gray-500" />
      </div>
      <div>
        <label className="block text-sm font-bold mb-1">キャッチコピー</label>
        <textarea value={formData.catchphrase} onChange={e => setFormData(prev => ({ ...prev, catchphrase: e.target.value }))} rows={2} className="w-full p-3 border rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-bold mb-1">詳細説明</label>
        <RichTextEditor value={formData.content} onChange={val => setFormData(prev => ({ ...prev, content: val }))} />
      </div>

      {/* SEO */}
      <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm font-bold">SEO設定</p>
          <button type="button" onClick={handleSeoSuggest} disabled={loadingSeo} className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full font-bold">{loadingSeo ? "生成中..." : "AIで生成"}</button>
        </div>
        <input placeholder="メタキーワード" value={formData.metaKeywords} onChange={e => setFormData(prev => ({ ...prev, metaKeywords: e.target.value }))} className="w-full p-2 border rounded text-sm" />
        <textarea placeholder="メタディスクリプション" value={formData.metaDescription} onChange={e => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))} rows={2} className="w-full p-2 border rounded text-sm" />
        <input placeholder="canonical URL" value={formData.canonicalUrl} onChange={e => setFormData(prev => ({ ...prev, canonicalUrl: e.target.value }))} className="w-full p-2 border rounded text-sm" />
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <label className="block text-xs font-bold text-red-700 mb-1">⚡ 303リダイレクト先URL（設定するとこのページにアクセス時に転送されます）</label>
          <input placeholder="例: https://brightofhouse.jp/service/other-page" value={formData.redirectUrl} onChange={e => setFormData(prev => ({ ...prev, redirectUrl: e.target.value }))} className="w-full p-2 border border-red-300 rounded text-sm" />
          {formData.redirectUrl && <p className="text-[10px] text-red-600 mt-1 font-bold">⚠️ このURLが設定されている間、このページは表示されず転送されます</p>}
        </div>

      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link href="/admin/service-pages" className="flex-1 bg-gray-500 text-white py-3 rounded font-bold text-center">キャンセル</Link>
        {editId && <a href={`/service/${formData.slug}`} target="_blank" className="flex-1 bg-blue-500 text-white py-3 rounded font-bold text-center">プレビュー</a>}
        <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 text-white py-3 rounded font-bold">{loading ? "保存中..." : "保存"}</button>
      </div>

      {message && <p className="text-center text-sm text-blue-600 font-bold">{message}</p>}

      {/* Copy modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold mb-4">他ページからコピー</h3>
            {copyPages.map(p => (
              <button key={p.id} type="button" onClick={() => copyFrom(p)} className="block w-full text-left p-3 hover:bg-slate-50 border-b text-sm">{p.title}</button>
            ))}
            <button type="button" onClick={() => setShowCopyModal(false)} className="mt-4 w-full bg-gray-200 py-2 rounded font-bold text-sm">閉じる</button>
          </div>
        </div>
      )}
    </form>
  );
}

export default function ServicePageEdit() {
  return <Suspense fallback={<div className="p-8 text-center">読み込み中...</div>}><EditForm /></Suspense>;
}
