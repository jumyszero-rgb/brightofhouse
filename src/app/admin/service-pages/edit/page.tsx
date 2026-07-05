// @/src/app/admin/service-pages/edit/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import RichTextEditor from "@/components/RichTextEditor";
import Link from "next/link";
import BookingDataEditor, {
  newMain,
  newSetDiscount,
  type MainService,
  type LegacyOptionService,
  type BookingFormData,
} from "@/components/admin/BookingDataEditor";

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
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItem, setNewItem] = useState({ categoryId: "", title: "", basePrice: "", estimatedMinutes: "60" });
  const [creatingItem, setCreatingItem] = useState(false);
  const [bookingCategories, setBookingCategories] = useState<any[]>([]);
  const [bookingMenuIds, setBookingMenuIds] = useState<string[]>([]);
  const [menuToAdd, setMenuToAdd] = useState("");
  const [bookingCategoryIds, setBookingCategoryIds] = useState<string[]>([]);
  const [categoryToAdd, setCategoryToAdd] = useState("");
  const [displayMenuIds, setDisplayMenuIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    slug: "", title: "", linkTitle: "", status: "DRAFT",
    serviceItemId: "", catchphrase: "", content: "", metaKeywords: "", metaDescription: "", noIndex: false, showOnHome: false, canonicalUrl: "", redirectUrl: "", cardIcon: ""
  });

  // 一覧カード（トップページ・エリアページ・関連サービス欄）で使うアイコンの候補
  const CARD_ICON_OPTIONS = ["🧹", "🚿", "🍳", "🚽", "🪟", "🛋️", "🏠", "🧺", "🧽", "🌀", "🗑️", "✨"];

  const [bookingData, setBookingData] = useState<BookingFormData>({
    mains: [newMain()],
  });

  const [faqs, setFaqs] = useState<{ id: string; question: string; answer: string }[]>([]);
  const [testimonials, setTestimonials] = useState<{ id: string; authorLabel: string; rating: number | null; body: string; isActive: boolean }[]>([]);

  useEffect(() => {
    fetch("/api/service-items").then(r => r.json()).then(setServiceItems).catch(() => {});
    fetch("/api/services").then(r => r.json()).then(setServiceCategories).catch(() => {});
    fetch("/api/booking-master").then(r => r.json()).then(setBookingCategories).catch(() => {});
  }, []);

  const handleCreateServiceItem = async () => {
    if (!newItem.categoryId || !newItem.title) {
      alert("カテゴリと項目名を入力してください");
      return;
    }
    setCreatingItem(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "item",
          categoryId: newItem.categoryId,
          title: newItem.title,
          basePrice: Number(newItem.basePrice) || 0,
          estimatedMinutes: Number(newItem.estimatedMinutes) || 60,
          order: 0,
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setServiceItems(prev => [...prev, { id: created.id, title: created.title, subTitle: created.subTitle }]);
      setFormData(prev => ({ ...prev, serviceItemId: created.id }));
      setNewItem({ categoryId: "", title: "", basePrice: "", estimatedMinutes: "60" });
      setShowNewItemForm(false);
    } catch {
      alert("作成に失敗しました");
    } finally {
      setCreatingItem(false);
    }
  };

  useEffect(() => {
    if (!editId) return;
    fetch(`/api/service-pages?id=${editId}`).then(r => r.json()).then(data => {
      setFormData({
        slug: data.slug || "", title: data.title || "", linkTitle: data.linkTitle || "",
        status: data.status || "DRAFT", serviceItemId: data.serviceItemId || "",
        catchphrase: data.catchphrase || "", content: data.content || "",
        metaKeywords: data.metaKeywords || "", metaDescription: data.metaDescription || "",
                noIndex: data.noIndex || false, showOnHome: data.showOnHome || false, canonicalUrl: data.canonicalUrl || "", redirectUrl: data.redirectUrl || "", cardIcon: data.cardIcon || ""

      });
      if (data.heroImage) setPreviewImage(data.heroImage);

      setBookingMenuIds((data.bookingMenus || []).map((m: any) => m.id));
      setBookingCategoryIds((data.bookingCategories || []).map((c: any) => c.id));
      setDisplayMenuIds(data.displayMenuIds || []);
      setFaqs((data.faqs || []).map((f: any) => ({ id: f.id || crypto.randomUUID(), question: f.question, answer: f.answer })));
      setTestimonials((data.testimonials || []).map((t: any) => ({ id: t.id || crypto.randomUUID(), authorLabel: t.authorLabel, rating: t.rating ?? null, body: t.body, isActive: t.isActive })));

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
  const copiedMains = (bd.mains || []).map((m: any) => {
    // foldItemのID変換マップを作成
    const idMap = new Map<string, string>();
    const newFoldItems = (m.foldItems || []).map((fi: any) => {
      const newId = crypto.randomUUID();
      idMap.set(fi.id, newId);
      return { ...fi, id: newId };
    });
    // optionsのparentFoldItemIdを新しいIDに変換
    const newOptions = (m.options || []).map((o: any) => ({
      ...o,
      id: crypto.randomUUID(),
      parentFoldItemId: o.parentFoldItemId ? idMap.get(o.parentFoldItemId) || o.parentFoldItemId : undefined,
    }));
    return {
      ...m,
      id: crypto.randomUUID(),
      foldTitle: m.foldTitle || "",
      foldItems: newFoldItems,
      options: newOptions,
      setDiscount: m.setDiscount || newSetDiscount(),
    };
  });
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
      form.set("bookingMenuIds", JSON.stringify(bookingMenuIds));
      form.set("bookingCategoryIds", JSON.stringify(bookingCategoryIds));
      form.set("displayMenuIds", JSON.stringify(displayMenuIds));
      form.set("catchphrase", formData.catchphrase);
      form.set("content", formData.content);
      form.set("metaKeywords", formData.metaKeywords);
      form.set("metaDescription", formData.metaDescription);
      form.set("noIndex", String(formData.noIndex));
      form.set("showOnHome", String(formData.showOnHome));  // ← 追加
      form.set("canonicalUrl", formData.canonicalUrl);
      form.set("redirectUrl", formData.redirectUrl);
      form.set("cardIcon", formData.cardIcon);
      form.set("faqs", JSON.stringify(faqs.filter(f => f.question.trim() || f.answer.trim()).map(({ question, answer }) => ({ question, answer }))));
      form.set("testimonials", JSON.stringify(testimonials.filter(t => t.authorLabel.trim() || t.body.trim()).map(({ authorLabel, rating, body, isActive }) => ({ authorLabel, rating, body, isActive }))));


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
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-bold text-emerald-800 mb-1">連動する大分類（予約マスター・複数追加可）</label>
            <p className="text-xs text-emerald-600 mb-2">
              大分類ごと追加すると、配下の中分類すべてが選択肢として並び、大分類側の「まとめ割引」がこのページで有効になります。
            </p>

            {bookingCategoryIds.length > 0 && (
              <ul className="space-y-1 mb-2">
                {bookingCategoryIds.map((id) => {
                  const cat = bookingCategories.find((c: any) => c.id === id);
                  return (
                    <li key={id} className="flex items-center justify-between bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm">
                      <span>{cat?.title || "（読み込み中...）"}</span>
                      <button type="button" onClick={() => setBookingCategoryIds(prev => prev.filter(x => x !== id))} className="text-red-500 text-xs font-bold hover:underline">削除</button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="flex gap-2">
              <select value={categoryToAdd} onChange={e => setCategoryToAdd(e.target.value)} className="flex-1 p-3 border rounded-lg">
                <option value="">追加する大分類を選択</option>
                {bookingCategories.filter((c: any) => !bookingCategoryIds.includes(c.id)).map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.title}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => { if (categoryToAdd) { setBookingCategoryIds(prev => [...prev, categoryToAdd]); setCategoryToAdd(""); } }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700"
              >
                ＋ 追加
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-emerald-800 mb-1">連動する中分類（予約マスター・複数追加可）</label>

            {bookingMenuIds.length > 0 && (
              <ul className="space-y-1 mb-2">
                {bookingMenuIds.map((id) => {
                  const menu = bookingCategories.flatMap((c: any) => c.menus).find((m: any) => m.id === id);
                  return (
                    <li key={id} className="flex items-center justify-between bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm">
                      <span>{menu?.title || "（読み込み中...）"}</span>
                      <button type="button" onClick={() => setBookingMenuIds(prev => prev.filter(x => x !== id))} className="text-red-500 text-xs font-bold hover:underline">削除</button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="flex gap-2">
              <select value={menuToAdd} onChange={e => setMenuToAdd(e.target.value)} className="flex-1 p-3 border rounded-lg">
                <option value="">追加する中分類を選択</option>
                {bookingCategories.map((cat: any) => (
                  <optgroup key={cat.id} label={cat.title}>
                    {cat.menus.filter((m: any) => !bookingMenuIds.includes(m.id)).map((menu: any) => <option key={menu.id} value={menu.id}>{menu.title}</option>)}
                  </optgroup>
                ))}
              </select>
              <button
                type="button"
                onClick={() => { if (menuToAdd) { setBookingMenuIds(prev => [...prev, menuToAdd]); setMenuToAdd(""); } }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700"
              >
                ＋ 追加
              </button>
            </div>

            <p className="text-xs text-emerald-600 mt-2">
              選ぶと、予約マスターの価格・所要時間・メニュー構成が予約フォームに自動反映され、マスターの更新が即座にこのページへ反映されます（価格ズレ防止）。
            </p>
          </div>

          {(bookingMenuIds.length > 0 || bookingCategoryIds.length > 0) && (
            <p className="text-xs text-slate-500">
              ※このページの予約メニューはマスター連動中のため、下部の手入力エディタは無効です。内容の編集は<Link href="/admin/booking-master" className="text-blue-600 underline">予約マスター管理画面</Link>で行ってください。
            </p>
          )}
        </div>

        {(() => {
          const poolMenus = [
            ...bookingMenuIds.map((id) => bookingCategories.flatMap((c: any) => c.menus).find((m: any) => m.id === id)),
            ...bookingCategoryIds.flatMap((cid) => bookingCategories.find((c: any) => c.id === cid)?.menus || []),
          ].filter(Boolean);
          const uniquePoolMenus = Array.from(new Map(poolMenus.map((m: any) => [m.id, m])).values());
          if (uniquePoolMenus.length === 0) return null;

          const isDisplayed = (id: string) => displayMenuIds.length === 0 || displayMenuIds.includes(id);
          const toggleDisplay = (id: string) => {
            setDisplayMenuIds(prev => {
              const base = prev.length === 0 ? uniquePoolMenus.map((m: any) => m.id) : prev;
              return base.includes(id) ? base.filter((x: string) => x !== id) : [...base, id];
            });
          };

          return (
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg">
              <label className="block text-sm font-bold text-sky-800 mb-1">本文（現在の料金欄）に表示する項目</label>
              <p className="text-xs text-sky-600 mb-2">
                予約フォームには上で連動したメニューがすべて表示されますが、ページ本文の「現在の料金」欄にはここでチェックした項目のみ表示されます（未チェックがあっても予約自体は可能です）。
              </p>
              <div className="space-y-1">
                {uniquePoolMenus.map((m: any) => (
                  <label key={m.id} className="flex items-center gap-2 bg-white border border-sky-100 rounded-lg px-3 py-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={isDisplayed(m.id)} onChange={() => toggleDisplay(m.id)} className="w-4 h-4 accent-sky-600" />
                    {m.title}
                  </label>
                ))}
              </div>
            </div>
          );
        })()}

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-bold">連動するサービス項目（旧・料金表）</label>
            <button type="button" onClick={() => setShowNewItemForm(v => !v)} className="text-xs text-blue-600 font-bold hover:underline">
              {showNewItemForm ? "閉じる" : "＋ 新規作成"}
            </button>
          </div>
          <select value={formData.serviceItemId} onChange={e => setFormData(prev => ({ ...prev, serviceItemId: e.target.value }))} className="w-full p-3 border rounded-lg">
            <option value="">（選択しない）</option>
            {serviceItems.map((item: any) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <p className="text-xs text-slate-400 mt-1">上の予約メニューが未選択の場合のみ使われます。選ぶと、料金表と同じ価格・所要時間がこのページに自動反映されます。</p>

          {showNewItemForm && (
            <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <p className="text-xs font-bold text-slate-600">新しいサービス項目（料金表の1行）を作成してすぐ連携</p>
              <select value={newItem.categoryId} onChange={e => setNewItem(prev => ({ ...prev, categoryId: e.target.value }))} className="w-full p-2 border rounded text-sm">
                <option value="">カテゴリを選択</option>
                {serviceCategories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.title}</option>)}
              </select>
              <input value={newItem.title} onChange={e => setNewItem(prev => ({ ...prev, title: e.target.value }))} placeholder="項目名（例：キッチンクリーニング）" className="w-full p-2 border rounded text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={newItem.basePrice} onChange={e => setNewItem(prev => ({ ...prev, basePrice: e.target.value }))} placeholder="基本価格（円）" className="w-full p-2 border rounded text-sm" />
                <input type="number" value={newItem.estimatedMinutes} onChange={e => setNewItem(prev => ({ ...prev, estimatedMinutes: e.target.value }))} placeholder="所要時間（分）" className="w-full p-2 border rounded text-sm" />
              </div>
              <button type="button" onClick={handleCreateServiceItem} disabled={creatingItem} className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
                {creatingItem ? "作成中..." : "作成して連携する"}
              </button>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">一覧ページのボタン表示名</label>
          <input value={formData.linkTitle} onChange={e => setFormData(prev => ({ ...prev, linkTitle: e.target.value }))} placeholder="例: 浴室クリーニング（空欄時はタイトルを使用）" className="w-full p-3 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">一覧カードのアイコン</label>
          <p className="text-xs text-slate-400 mb-2">トップページ・エリアページ・関連サービス欄のカードに表示されます</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, cardIcon: "" }))}
              className={`w-10 h-10 rounded-lg border flex items-center justify-center text-xs ${formData.cardIcon === "" ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}
            >
              なし
            </button>
            {CARD_ICON_OPTIONS.map(icon => (
              <button
                type="button"
                key={icon}
                onClick={() => setFormData(prev => ({ ...prev, cardIcon: icon }))}
                className={`w-10 h-10 rounded-lg border flex items-center justify-center text-xl ${formData.cardIcon === icon ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}
              >
                {icon}
              </button>
            ))}
          </div>
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
          <label className="flex items-center gap-2 text-sm font-bold text-blue-700 cursor-pointer mt-3">
            <input type="checkbox" checked={formData.showOnHome} onChange={() => setFormData(prev => ({ ...prev, showOnHome: !prev.showOnHome }))} className="w-5 h-5 accent-blue-600" />
            トップページに表示する
          </label>
        </div>
      </div>

      {bookingMenuIds.length === 0 && bookingCategoryIds.length === 0 && (
        <BookingDataEditor
          value={bookingData}
          onChange={setBookingData}
          title="このページの予約メニュー設定"
          headerExtra={
            <button type="button" onClick={openCopyModal} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full font-bold hover:bg-blue-600">📋 他ページからコピー</button>
          }
        />
      )}

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

      {/* FAQ */}
      <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-sky-800">❓ このページのFAQ</h2>
          <button
            type="button"
            onClick={() => setFaqs(prev => [...prev, { id: crypto.randomUUID(), question: "", answer: "" }])}
            className="text-xs bg-sky-600 text-white px-3 py-1 rounded-full font-bold hover:bg-sky-700"
          >
            ＋ FAQを追加
          </button>
        </div>
        {faqs.length === 0 && <p className="text-xs text-slate-400">FAQはまだありません。</p>}
        {faqs.map((faq, idx) => (
          <div key={faq.id} className="bg-white p-4 rounded-lg border border-sky-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">Q{idx + 1}</span>
              <button
                type="button"
                onClick={() => setFaqs(prev => prev.filter(f => f.id !== faq.id))}
                className="text-xs text-red-500 hover:underline"
              >
                削除
              </button>
            </div>
            <input
              value={faq.question}
              onChange={e => setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, question: e.target.value } : f))}
              placeholder="質問"
              className="w-full p-2 border rounded text-sm"
            />
            <textarea
              value={faq.answer}
              onChange={e => setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, answer: e.target.value } : f))}
              placeholder="回答"
              rows={2}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
        ))}
      </div>

      {/* お客様の声 */}
      <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-amber-800">💬 お客様の声</h2>
          <button
            type="button"
            onClick={() => setTestimonials(prev => [...prev, { id: crypto.randomUUID(), authorLabel: "", rating: 5, body: "", isActive: true }])}
            className="text-xs bg-amber-600 text-white px-3 py-1 rounded-full font-bold hover:bg-amber-700"
          >
            ＋ お客様の声を追加
          </button>
        </div>
        {testimonials.length === 0 && <p className="text-xs text-slate-400">お客様の声はまだありません。</p>}
        {testimonials.map((t) => (
          <div key={t.id} className="bg-white p-4 rounded-lg border border-amber-100 space-y-2">
            <div className="flex justify-between items-center gap-2">
              <input
                value={t.authorLabel}
                onChange={e => setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, authorLabel: e.target.value } : x))}
                placeholder="お客様の表示名（例：札幌市 K様）"
                className="flex-1 p-2 border rounded text-sm"
              />
              <select
                value={t.rating ?? ""}
                onChange={e => setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, rating: e.target.value ? Number(e.target.value) : null } : x))}
                className="p-2 border rounded text-sm"
              >
                <option value="">評価なし</option>
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>★{n}</option>)}
              </select>
              <label className="flex items-center gap-1 text-xs font-bold text-amber-700 whitespace-nowrap">
                <input type="checkbox" checked={t.isActive} onChange={() => setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, isActive: !x.isActive } : x))} className="w-4 h-4 accent-amber-600" />
                表示
              </label>
              <button
                type="button"
                onClick={() => setTestimonials(prev => prev.filter(x => x.id !== t.id))}
                className="text-xs text-red-500 hover:underline"
              >
                削除
              </button>
            </div>
            <textarea
              value={t.body}
              onChange={e => setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, body: e.target.value } : x))}
              placeholder="お客様の声の本文"
              rows={2}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
        ))}
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
