// @/src/app/admin/lp/edit/page.tsx
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import RichTextEditor from "@/components/RichTextEditor";
import Link from "next/link";
import BookingDataEditor, { newMain, newSetDiscount, type BookingFormData } from "@/components/admin/BookingDataEditor";

function EditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [loadingSeo, setLoadingSeo] = useState(false);
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
    ctaLink: "/contact",
    metaKeywords: "",
    metaDescription: "",
    showBottomCta: true,
    noIndex: true,
    canonicalUrl: "",
  });

  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [bookingData, setBookingData] = useState<BookingFormData>({ mains: [newMain()] });
  const [bookingCategories, setBookingCategories] = useState<any[]>([]);
  const [bookingMenuIds, setBookingMenuIds] = useState<string[]>([]);
  const [menuToAdd, setMenuToAdd] = useState("");
  const [bookingCategoryIds, setBookingCategoryIds] = useState<string[]>([]);
  const [categoryToAdd, setCategoryToAdd] = useState("");

  // ===== リッチLPテンプレート =====
  const [templateStyle, setTemplateStyle] = useState<"SIMPLE" | "RICH">("SIMPLE");
  const [richFields, setRichFields] = useState({
    heroEyebrow: "", heroSubtitle: "", heroPriceLead: "", serviceLabel: "",
    menuIntro: "", campaignBadge: "", setNote: "",
  });
  const [pains, setPains] = useState<{ id: string; text: string }[]>([]);
  const [menuItems, setMenuItems] = useState<{ id: string; name: string; price: string; note: string; compare: string }[]>([]);
  const [menuOptions, setMenuOptions] = useState<{ id: string; name: string; price: string; note: string }[]>([]);
  const [baseWork, setBaseWork] = useState<{ id: string; text: string; type: "check" | "caution" | "info" }[]>([]);
  const [recommended, setRecommended] = useState<{ id: string; name: string; price: string; badge: string; note: string }[]>([]);
  const [reasons, setReasons] = useState<{ id: string; title: string; body: string }[]>([]);
  const [richFaqs, setRichFaqs] = useState<{ id: string; q: string; a: string }[]>([]);
  const [voices, setVoices] = useState<{ id: string; text: string; who: string; stars: number }[]>([]);
  const [steps, setSteps] = useState<{ id: string; t: string; d: string }[]>([]);
  const [allBeforeAfters, setAllBeforeAfters] = useState<any[]>([]);
  const [beforeAfterIds, setBeforeAfterIds] = useState<string[]>([]);
  const [beforeAfterToAdd, setBeforeAfterToAdd] = useState("");
  const [menuOptionRefIds, setMenuOptionRefIds] = useState<string[]>([]);
  const [menuSubMenuRefIds, setMenuSubMenuRefIds] = useState<string[]>([]);
  const [menuItemRefIds, setMenuItemRefIds] = useState<string[]>([]);
  const [menuItemRefToAdd, setMenuItemRefToAdd] = useState("");
  const [menuOptionRefToAdd, setMenuOptionRefToAdd] = useState("");
  const [allServicePages, setAllServicePages] = useState<any[]>([]);
  const [testimonialServicePageIds, setTestimonialServicePageIds] = useState<string[]>([]);
  const [testimonialServicePageToAdd, setTestimonialServicePageToAdd] = useState("");
  const [faqServicePageIds, setFaqServicePageIds] = useState<string[]>([]);
  const [faqServicePageToAdd, setFaqServicePageToAdd] = useState("");

  useEffect(() => {
    fetch("/api/booking-master").then(r => r.json()).then(setBookingCategories).catch(() => {});
    fetch("/api/before-after").then(r => r.json()).then(setAllBeforeAfters).catch(() => {});
    fetch("/api/service-pages").then(r => r.json()).then(setAllServicePages).catch(() => {});
  }, []);

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
          ctaLink: data.ctaLink || "/contact",
          metaKeywords: data.metaKeywords || "",
          metaDescription: data.metaDescription || "",
          showBottomCta: data.showBottomCta !== false,
          noIndex: data.noIndex || false,
          canonicalUrl: data.canonicalUrl || "",

        });
        if (data.heroImage) setPreviewImage(data.heroImage);

        setBookingMenuIds((data.bookingMenus || []).map((m: any) => m.id));
        setBookingCategoryIds((data.bookingCategories || []).map((c: any) => c.id));

        setTemplateStyle(data.templateStyle === "RICH" ? "RICH" : "SIMPLE");
        setRichFields({
          heroEyebrow: data.heroEyebrow || "",
          heroSubtitle: data.heroSubtitle || "",
          heroPriceLead: data.heroPriceLead || "",
          serviceLabel: data.serviceLabel || "",
          menuIntro: data.menuIntro || "",
          campaignBadge: data.campaignBadge || "",
          setNote: data.setNote || "",
        });
        setPains(((data.pains as string[]) || []).map((text: string) => ({ id: crypto.randomUUID(), text })));
        setMenuItems(((data.menuItems as any[]) || []).map((m) => ({ id: crypto.randomUUID(), name: m.name || "", price: m.price || "", note: m.note || "", compare: m.compare || "" })));
        setMenuOptions(((data.menuOptions as any[]) || []).map((m) => ({ id: crypto.randomUUID(), name: m.name || "", price: m.price || "", note: m.note || "" })));
        setBaseWork(((data.baseWork as any[]) || []).map((w) => typeof w === "string" ? { id: crypto.randomUUID(), text: w, type: "check" as const } : { id: crypto.randomUUID(), text: w.text || "", type: w.type || "check" }));
        setRecommended(((data.recommended as any[]) || []).map((r) => ({ id: crypto.randomUUID(), name: r.name || "", price: r.price || "", badge: r.badge || "", note: r.note || "" })));
        setReasons(((data.reasons as any[]) || []).map((r) => ({ id: crypto.randomUUID(), title: r.title || "", body: r.body || "" })));
        setRichFaqs(((data.faqItems as any[]) || []).map((f) => ({ id: crypto.randomUUID(), q: f.q || "", a: f.a || "" })));
        setVoices(((data.voices as any[]) || []).map((v) => ({ id: crypto.randomUUID(), text: v.text || "", who: v.who || "", stars: v.stars ?? 5 })));
        setSteps(((data.steps as any[]) || []).map((s) => ({ id: crypto.randomUUID(), t: s.t || "", d: s.d || "" })));
        setBeforeAfterIds((data.beforeAfters || []).map((b: any) => b.id));
        setMenuOptionRefIds((data.menuOptionRefs || []).map((o: any) => o.id));
        setMenuSubMenuRefIds((data.menuSubMenuRefs || []).map((s: any) => s.id));
        setMenuItemRefIds((data.menuItemRefs || []).map((m: any) => m.id));
        setTestimonialServicePageIds((data.testimonialServicePages || []).map((s: any) => s.id));
        setFaqServicePageIds((data.faqServicePages || []).map((s: any) => s.id));

        const bd = data.bookingData;
        if (bd && bd.mains) {
          setBookingEnabled(true);
          setBookingData({
            mains: bd.mains.map((m: any) => ({
              ...m,
              id: m.id || crypto.randomUUID(),
              foldTitle: m.foldTitle || "",
              foldItems: (m.foldItems || []).map((fi: any) => ({ ...fi, id: fi.id || crypto.randomUUID(), comment: fi.comment || "" })),
              options: (m.options || []).map((o: any) => ({ ...o, id: o.id || crypto.randomUUID(), comment: o.comment || "" })),
              setDiscount: m.setDiscount || newSetDiscount(),
            })),
          });
        }
      });
  }, [editId]);

  const handleSeoSuggest = async () => {
    if (!formData.title || !formData.content) {
      return alert("タイトルと本文を先に入力してください。");
    }
    setLoadingSeo(true);
    try {
      const res = await fetch("/api/seo/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formData.title, content: formData.content }),
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({
          ...prev,
          metaKeywords: data.metaKeywords,
          metaDescription: data.metaDescription
        }));
      }
    } catch (e) {
      alert("AI提案に失敗しました");
    } finally {
      setLoadingSeo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(e.currentTarget);
    if (editId) form.append("id", editId);

    form.set("content", formData.content);
    form.set("showOnHome", String(formData.showOnHome));
    form.set("category", formData.category);
    form.set("metaKeywords", formData.metaKeywords);
    form.set("metaDescription", formData.metaDescription);
    form.set("showBottomCta", String(formData.showBottomCta));
    form.set("noIndex", String(formData.noIndex));
    form.set("canonicalUrl", formData.canonicalUrl);
    form.set("bookingMenuIds", JSON.stringify(bookingMenuIds));
    form.set("bookingCategoryIds", JSON.stringify(bookingCategoryIds));
    form.set("bookingData", (bookingMenuIds.length === 0 && bookingCategoryIds.length === 0 && bookingEnabled) ? JSON.stringify({ mains: bookingData.mains }) : "");

    form.set("templateStyle", templateStyle);
    form.set("heroEyebrow", richFields.heroEyebrow);
    form.set("heroSubtitle", richFields.heroSubtitle);
    form.set("heroPriceLead", richFields.heroPriceLead);
    form.set("serviceLabel", richFields.serviceLabel);
    form.set("menuIntro", richFields.menuIntro);
    form.set("campaignBadge", richFields.campaignBadge);
    form.set("setNote", richFields.setNote);
    form.set("pains", JSON.stringify(pains.filter(p => p.text.trim()).map(p => p.text)));
    form.set("menuItems", JSON.stringify(menuItems.filter(m => m.name.trim()).map(({ name, price, note, compare }) => ({ name, price, note, compare }))));
    form.set("menuOptions", JSON.stringify(menuOptions.filter(m => m.name.trim()).map(({ name, price, note }) => ({ name, price, note }))));
    form.set("baseWork", JSON.stringify(baseWork.filter(w => w.text.trim()).map(({ text, type }) => ({ text, type }))));
    form.set("recommended", JSON.stringify(recommended.filter(r => r.name.trim()).map(({ name, price, badge, note }) => ({ name, price, badge, note }))));
    form.set("reasons", JSON.stringify(reasons.filter(r => r.title.trim()).map(({ title, body }) => ({ title, body }))));
    form.set("faqItems", JSON.stringify(richFaqs.filter(f => f.q.trim()).map(({ q, a }) => ({ q, a }))));
    form.set("voices", JSON.stringify(voices.filter(v => v.text.trim()).map(({ text, who, stars }) => ({ text, who, stars }))));
    form.set("steps", JSON.stringify(steps.filter(s => s.t.trim()).map(({ t, d }) => ({ t, d }))));
    form.set("beforeAfterIds", JSON.stringify(beforeAfterIds));
    form.set("menuOptionRefIds", JSON.stringify(menuOptionRefIds));
    form.set("menuSubMenuRefIds", JSON.stringify(menuSubMenuRefIds));
    form.set("menuItemRefIds", JSON.stringify(menuItemRefIds));
    form.set("testimonialServicePageIds", JSON.stringify(testimonialServicePageIds));
    form.set("faqServicePageIds", JSON.stringify(faqServicePageIds));


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

  // 予約マスターの全オプション(BookingOption)・小分類(BookingSubMenu)を
  // 「大分類 > 中分類 > 小分類 > オプション」の形にフラット化（小分類自体もオプション扱いする運用があるため）
  const flatBookingOptions = useMemo(() => {
    const rows: { id: string; kind: "option" | "subMenu"; label: string; price: number }[] = [];
    for (const cat of bookingCategories) {
      for (const menu of cat.menus || []) {
        for (const opt of menu.options || []) {
          rows.push({ id: opt.id, kind: "option", label: `${cat.title} > ${menu.title} > ${opt.title}`, price: opt.price });
        }
        for (const sub of menu.subMenus || []) {
          rows.push({ id: sub.id, kind: "subMenu", label: `${cat.title} > ${menu.title} > ${sub.title}［小分類］`, price: sub.price });
          for (const opt of sub.options || []) {
            rows.push({ id: opt.id, kind: "option", label: `${cat.title} > ${menu.title} > ${sub.title} > ${opt.title}`, price: opt.price });
          }
        }
      }
    }
    return rows;
  }, [bookingCategories]);

  // 予約マスターの中分類(BookingMenu)を「大分類 > 中分類」の形にフラット化（料金表の項目連動用）
  const flatBookingMenus = useMemo(() => {
    const rows: { id: string; label: string; price: number }[] = [];
    for (const cat of bookingCategories) {
      for (const menu of cat.menus || []) {
        rows.push({ id: menu.id, label: `${cat.title} > ${menu.title}`, price: menu.basePrice });
      }
    }
    return rows;
  }, [bookingCategories]);

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md text-black">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">{editId ? "ページ編集" : "新規作成"}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 基本設定 */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-4 border border-slate-200">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">ページタイトル（H1 / 予約カテゴリ名と一致させてください）</label>
              <input name="title" required value={formData.title} onChange={handleChange} className="w-full p-2 border rounded" placeholder="例: 水回りクリーニング" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">リンク用タイトル（任意）</label>
              <input name="linkTitle" value={formData.linkTitle} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50" placeholder="例: 水回り" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">URL (slug)</label>
              <input name="slug" required value={formData.slug} onChange={handleChange} className="w-full p-2 border rounded font-mono" placeholder="water-cleaning" />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 border-t pt-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">種類</label>
              <select name="category" value={formData.category} onChange={handleChange} className="p-2 border rounded font-bold bg-white text-black">
                <option value="CAMPAIGN">🔥 キャンペーン</option>
                <option value="AREA">📍 地域別ページ</option>
                <option value="SERVICE_DETAIL">🛠 サービス詳細ページ</option>
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

            <div className="flex items-center pt-2">
              <label className="flex items-center gap-2 text-sm font-bold text-orange-700 cursor-pointer">
                <input type="checkbox" checked={formData.showBottomCta} onChange={() => setFormData(prev => ({ ...prev, showBottomCta: !prev.showBottomCta }))} className="w-5 h-5 accent-orange-600" />
                下部CTA（電話・LINE・問い合わせ）を表示する
              </label>
            </div>

            <div className="flex items-center pt-2">
              <label className="flex items-center gap-2 text-sm font-bold text-red-700 cursor-pointer">
                <input type="checkbox" name="noIndex" checked={formData.noIndex} onChange={handleChange} className="w-5 h-5 accent-red-600" />
                インデックスしない（noindex）
              </label>
            </div>

          </div>
        </div>

        {/* コンテンツ */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">メイン画像</label>
          {previewImage && <div className="relative h-40 w-full mb-2 overflow-hidden rounded border"><Image src={previewImage} alt="Hero" fill className="object-cover" /></div>}
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

        <div className="pb-4">
          <label className="block text-sm font-bold text-gray-700 mb-1">本文</label>
          <RichTextEditor key={editId} value={formData.content} onChange={(val) => setFormData(p => ({...p, content: val}))} />
        </div>

        {/* SEO設定エリア */}
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">🔍 SEO設定</h2>
            <button
              type="button"
              onClick={handleSeoSuggest}
              disabled={loadingSeo}
              className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-indigo-700 disabled:bg-slate-400 transition-all flex items-center gap-2"
            >
              {loadingSeo ? "考え中..." : "✨ AIにSEO案を作成させる"}
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-indigo-700 mb-1">重要キーワード（3〜5個・カンマ区切り）</label>
            <input
              name="metaKeywords"
              value={formData.metaKeywords}
              onChange={handleChange}
              placeholder="例: 札幌, キッチン清掃, 料金"
              className="w-full p-2 border border-indigo-200 rounded text-black"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-indigo-700 mb-1">検索結果用の説明文（meta description）</label>
            <textarea
              name="metaDescription"
              value={formData.metaDescription}
              onChange={handleChange}
              rows={3}
              placeholder="検索結果に表示される魅力的な紹介文を入力してください"
              className="w-full p-2 border border-indigo-200 rounded text-black text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-indigo-700 mb-1">canonical URL（空欄でデフォルト）</label>
            <input
              name="canonicalUrl"
              value={formData.canonicalUrl}
              onChange={handleChange}
              placeholder="例: https://brightofhouse.jp/lp/example"
              className="w-full p-2 border border-indigo-200 rounded text-black text-sm font-mono"
            />
          </div>
        </div>

        {/* 予約フォーム（任意） */}
        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 space-y-4">
          <div>
            <label className="block text-sm font-bold text-emerald-800 mb-1">連動する大分類（予約マスター・複数追加可）</label>
            <p className="text-xs text-emerald-600 mb-2">
              大分類ごと追加すると、配下の中分類すべてが選択肢として並び、大分類側の「まとめ割引」がこのLPで有効になります。
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
              選ぶと、予約マスターの価格・所要時間・メニュー構成をもとに予約カレンダー付きフォームがこのLPに表示され、マスターの更新が即座に反映されます。
            </p>
          </div>

          {bookingMenuIds.length === 0 && bookingCategoryIds.length === 0 && (
            <>
              <label className="flex items-center gap-2 text-sm font-bold text-emerald-800 cursor-pointer">
                <input type="checkbox" checked={bookingEnabled} onChange={() => setBookingEnabled(v => !v)} className="w-5 h-5 accent-emerald-600" />
                予約メニューを手入力してこのLPに予約カレンダー付きフォームを追加する
              </label>
              {bookingEnabled && (
                <BookingDataEditor value={bookingData} onChange={setBookingData} title="このLPの予約メニュー設定" />
              )}
            </>
          )}
        </div>

        {/* リッチLPテンプレート */}
        <div className="bg-fuchsia-50 p-6 rounded-xl border border-fuchsia-200 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-fuchsia-900 mb-2">🎨 リッチLPテンプレート</h2>
            <p className="text-xs text-fuchsia-600 mb-3">
              「詳細」を選ぶと、/lp/mizumawari 等の独立LPと同じ構成（お悩み・料金表・施工事例・お客様の声・FAQなど）で公開されます。「シンプル」の場合は上の本文＋CTAのみの従来通りの表示です。
            </p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={templateStyle === "SIMPLE"} onChange={() => setTemplateStyle("SIMPLE")} className="w-4 h-4 accent-fuchsia-600" />
                <span className="text-sm font-bold">シンプル（本文＋CTA）</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={templateStyle === "RICH"} onChange={() => setTemplateStyle("RICH")} className="w-4 h-4 accent-fuchsia-600" />
                <span className="text-sm font-bold">詳細（セールスLP構成）</span>
              </label>
            </div>
          </div>

          {templateStyle === "RICH" && (
            <div className="space-y-6 pt-4 border-t border-fuchsia-200">
              {/* ヒーロー拡張 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-fuchsia-700 mb-1">ヒーロー見出し上のラベル（例：札幌の水回りクリーニング）</label>
                  <input value={richFields.heroEyebrow} onChange={e => setRichFields(p => ({ ...p, heroEyebrow: e.target.value }))} className="w-full p-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-fuchsia-700 mb-1">価格バッジ（例：WEB限定 単品 ¥7,700〜）</label>
                  <input value={richFields.heroPriceLead} onChange={e => setRichFields(p => ({ ...p, heroPriceLead: e.target.value }))} className="w-full p-2 border rounded text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-fuchsia-700 mb-1">ヒーローサブコピー（キャッチコピーの下の説明文）</label>
                  <input value={richFields.heroSubtitle} onChange={e => setRichFields(p => ({ ...p, heroSubtitle: e.target.value }))} className="w-full p-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-fuchsia-700 mb-1">サービス名（フォーム送信・お問い合わせ種別に使用）</label>
                  <input value={richFields.serviceLabel} onChange={e => setRichFields(p => ({ ...p, serviceLabel: e.target.value }))} placeholder="例：水回りクリーニング" className="w-full p-2 border rounded text-sm" />
                </div>
              </div>

              {/* お悩み */}
              <div className="bg-white p-4 rounded-lg border border-fuchsia-100 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-fuchsia-800">こんなお悩みありませんか？</h3>
                  <button type="button" onClick={() => setPains(prev => [...prev, { id: crypto.randomUUID(), text: "" }])} className="text-xs bg-fuchsia-600 text-white px-3 py-1 rounded-full font-bold hover:bg-fuchsia-700">＋ 追加</button>
                </div>
                {pains.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-5">{idx + 1}.</span>
                    <input value={p.text} onChange={e => setPains(prev => prev.map(x => x.id === p.id ? { ...x, text: e.target.value } : x))} className="flex-1 p-2 border rounded text-sm" />
                    <button type="button" onClick={() => setPains(prev => prev.filter(x => x.id !== p.id))} className="text-xs text-red-500 hover:underline">削除</button>
                  </div>
                ))}
              </div>

              {/* メニュー・料金 */}
              <div className="bg-white p-4 rounded-lg border border-fuchsia-100 space-y-3">
                <h3 className="text-sm font-bold text-fuchsia-800">メニュー・料金</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input value={richFields.menuIntro} onChange={e => setRichFields(p => ({ ...p, menuIntro: e.target.value }))} placeholder="料金表の上に出す紹介文（任意）" className="w-full p-2 border rounded text-sm" />
                  <input value={richFields.campaignBadge} onChange={e => setRichFields(p => ({ ...p, campaignBadge: e.target.value }))} placeholder="キャンペーンバッジ（例：WEB限定割引価格）" className="w-full p-2 border rounded text-sm" />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-fuchsia-700">メニュー本体（予約マスター連動）</p>
                  <p className="text-[10px] text-slate-500">予約マスターの中分類から選ぶと、価格・作業内容・注意事項が常にマスターの最新値で表示されます。</p>
                  {menuItemRefIds.length > 0 && (
                    <ul className="space-y-1">
                      {menuItemRefIds.map((id) => {
                        const m = flatBookingMenus.find((x) => x.id === id);
                        return (
                          <li key={id} className="flex items-center justify-between gap-2 bg-white border border-fuchsia-200 rounded-lg px-3 py-2 text-sm">
                            <span className="min-w-0 break-words">{m?.label || "（読み込み中...）"}</span>
                            <button type="button" onClick={() => setMenuItemRefIds(prev => prev.filter(x => x !== id))} className="shrink-0 text-xs text-red-500 hover:underline">削除</button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <select value={menuItemRefToAdd} onChange={e => setMenuItemRefToAdd(e.target.value)} className="flex-1 min-w-0 basis-full sm:basis-0 p-2 border rounded-lg text-sm">
                      <option value="">追加する中分類を選択</option>
                      {flatBookingMenus.filter((m) => !menuItemRefIds.includes(m.id)).map((m) => (
                        <option key={m.id} value={m.id}>{m.label}（¥{m.price.toLocaleString()}）</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => { if (menuItemRefToAdd) { setMenuItemRefIds(prev => [...prev, menuItemRefToAdd]); setMenuItemRefToAdd(""); } }} className="shrink-0 bg-fuchsia-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-fuchsia-700">＋ 追加</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-fuchsia-700">メニュー本体（手入力）</p>
                    <button type="button" onClick={() => setMenuItems(prev => [...prev, { id: crypto.randomUUID(), name: "", price: "", note: "", compare: "" }])} className="text-xs bg-fuchsia-600 text-white px-3 py-1 rounded-full font-bold hover:bg-fuchsia-700">＋ 追加</button>
                  </div>
                  {menuItems.map((m) => (
                    <div key={m.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_2fr_1fr_auto] gap-2 items-start bg-fuchsia-50/60 p-2 rounded">
                      <input value={m.name} onChange={e => setMenuItems(prev => prev.map(x => x.id === m.id ? { ...x, name: e.target.value } : x))} placeholder="名称" className="p-2 border rounded text-sm" />
                      <input value={m.price} onChange={e => setMenuItems(prev => prev.map(x => x.id === m.id ? { ...x, price: e.target.value } : x))} placeholder="価格（例：¥9,800）" className="p-2 border rounded text-sm" />
                      <input value={m.note} onChange={e => setMenuItems(prev => prev.map(x => x.id === m.id ? { ...x, note: e.target.value } : x))} placeholder="説明" className="p-2 border rounded text-sm" />
                      <input value={m.compare} onChange={e => setMenuItems(prev => prev.map(x => x.id === m.id ? { ...x, compare: e.target.value } : x))} placeholder="比較価格（任意）" className="p-2 border rounded text-sm" />
                      <button type="button" onClick={() => setMenuItems(prev => prev.filter(x => x.id !== m.id))} className="text-xs text-red-500 hover:underline whitespace-nowrap">削除</button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-fuchsia-700">オプション・追加メニュー（予約マスター連動）</p>
                  <p className="text-[10px] text-slate-500">予約マスターのオプション・小分類（小分類自体をオプション扱いしている場合も可）から選ぶと、価格・名称が常にマスターの最新値で表示されます。</p>
                  {(menuOptionRefIds.length > 0 || menuSubMenuRefIds.length > 0) && (
                    <ul className="space-y-1">
                      {[...menuOptionRefIds.map(id => ({ id, kind: "option" as const })), ...menuSubMenuRefIds.map(id => ({ id, kind: "subMenu" as const }))].map(({ id, kind }) => {
                        const opt = flatBookingOptions.find((o) => o.id === id && o.kind === kind);
                        return (
                          <li key={`${kind}-${id}`} className="flex items-center justify-between gap-2 bg-white border border-fuchsia-200 rounded-lg px-3 py-2 text-sm">
                            <span className="min-w-0 break-words">{opt?.label || "（読み込み中...）"}</span>
                            <button type="button" onClick={() => kind === "option" ? setMenuOptionRefIds(prev => prev.filter(x => x !== id)) : setMenuSubMenuRefIds(prev => prev.filter(x => x !== id))} className="shrink-0 text-xs text-red-500 hover:underline">削除</button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <select value={menuOptionRefToAdd} onChange={e => setMenuOptionRefToAdd(e.target.value)} className="flex-1 min-w-0 basis-full sm:basis-0 p-2 border rounded-lg text-sm">
                      <option value="">追加するオプション・小分類を選択</option>
                      {flatBookingOptions.filter((o) => o.kind === "option" ? !menuOptionRefIds.includes(o.id) : !menuSubMenuRefIds.includes(o.id)).map((o) => (
                        <option key={`${o.kind}-${o.id}`} value={`${o.kind}:${o.id}`}>{o.label}（¥{o.price.toLocaleString()}）</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => {
                      if (!menuOptionRefToAdd) return;
                      const [kind, id] = menuOptionRefToAdd.split(":");
                      if (kind === "option") setMenuOptionRefIds(prev => [...prev, id]);
                      else setMenuSubMenuRefIds(prev => [...prev, id]);
                      setMenuOptionRefToAdd("");
                    }} className="shrink-0 bg-fuchsia-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-fuchsia-700">＋ 追加</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-fuchsia-700">オプション・追加メニュー（手入力）</p>
                    <button type="button" onClick={() => setMenuOptions(prev => [...prev, { id: crypto.randomUUID(), name: "", price: "", note: "" }])} className="text-xs bg-fuchsia-600 text-white px-3 py-1 rounded-full font-bold hover:bg-fuchsia-700">＋ 追加</button>
                  </div>
                  {menuOptions.map((m) => (
                    <div key={m.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_3fr_auto] gap-2 items-start bg-fuchsia-50/60 p-2 rounded">
                      <input value={m.name} onChange={e => setMenuOptions(prev => prev.map(x => x.id === m.id ? { ...x, name: e.target.value } : x))} placeholder="名称" className="p-2 border rounded text-sm" />
                      <input value={m.price} onChange={e => setMenuOptions(prev => prev.map(x => x.id === m.id ? { ...x, price: e.target.value } : x))} placeholder="価格" className="p-2 border rounded text-sm" />
                      <input value={m.note} onChange={e => setMenuOptions(prev => prev.map(x => x.id === m.id ? { ...x, note: e.target.value } : x))} placeholder="説明" className="p-2 border rounded text-sm" />
                      <button type="button" onClick={() => setMenuOptions(prev => prev.filter(x => x.id !== m.id))} className="text-xs text-red-500 hover:underline whitespace-nowrap">削除</button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-fuchsia-700">この料金に含まれる基本作業</p>
                    <button type="button" onClick={() => setBaseWork(prev => [...prev, { id: crypto.randomUUID(), text: "", type: "check" }])} className="text-xs bg-fuchsia-600 text-white px-3 py-1 rounded-full font-bold hover:bg-fuchsia-700">＋ 追加</button>
                  </div>
                  {baseWork.map((w) => (
                    <div key={w.id} className="flex items-center gap-2 bg-fuchsia-50/60 p-2 rounded">
                      <select value={w.type} onChange={e => setBaseWork(prev => prev.map(x => x.id === w.id ? { ...x, type: e.target.value as any } : x))} className="p-2 border rounded text-xs">
                        <option value="check">✓ 通常</option>
                        <option value="caution">⚠️ 注意</option>
                        <option value="info">💬 補足</option>
                      </select>
                      <input value={w.text} onChange={e => setBaseWork(prev => prev.map(x => x.id === w.id ? { ...x, text: e.target.value } : x))} className="flex-1 p-2 border rounded text-sm" />
                      <button type="button" onClick={() => setBaseWork(prev => prev.filter(x => x.id !== w.id))} className="text-xs text-red-500 hover:underline whitespace-nowrap">削除</button>
                    </div>
                  ))}
                </div>

                <input value={richFields.setNote} onChange={e => setRichFields(p => ({ ...p, setNote: e.target.value }))} placeholder="料金表の下に出す注記（任意）" className="w-full p-2 border rounded text-sm" />
              </div>

              {/* おすすめ人気メニュー */}
              <div className="bg-white p-4 rounded-lg border border-fuchsia-100 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-fuchsia-800">おすすめ人気メニュー（カード表示・任意）</h3>
                  <button type="button" onClick={() => setRecommended(prev => [...prev, { id: crypto.randomUUID(), name: "", price: "", badge: "", note: "" }])} className="text-xs bg-fuchsia-600 text-white px-3 py-1 rounded-full font-bold hover:bg-fuchsia-700">＋ 追加</button>
                </div>
                {recommended.map((r) => (
                  <div key={r.id} className="bg-fuchsia-50/60 p-2 rounded space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input value={r.name} onChange={e => setRecommended(prev => prev.map(x => x.id === r.id ? { ...x, name: e.target.value } : x))} placeholder="名称" className="p-2 border rounded text-sm" />
                      <input value={r.price} onChange={e => setRecommended(prev => prev.map(x => x.id === r.id ? { ...x, price: e.target.value } : x))} placeholder="価格" className="p-2 border rounded text-sm" />
                      <input value={r.badge} onChange={e => setRecommended(prev => prev.map(x => x.id === r.id ? { ...x, badge: e.target.value } : x))} placeholder="バッジ（例：人気No.1）" className="p-2 border rounded text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <input value={r.note} onChange={e => setRecommended(prev => prev.map(x => x.id === r.id ? { ...x, note: e.target.value } : x))} placeholder="説明" className="flex-1 p-2 border rounded text-sm" />
                      <button type="button" onClick={() => setRecommended(prev => prev.filter(x => x.id !== r.id))} className="text-xs text-red-500 hover:underline whitespace-nowrap">削除</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 選ばれる理由 */}
              <div className="bg-white p-4 rounded-lg border border-fuchsia-100 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-fuchsia-800">選ばれる理由</h3>
                  <button type="button" onClick={() => setReasons(prev => [...prev, { id: crypto.randomUUID(), title: "", body: "" }])} className="text-xs bg-fuchsia-600 text-white px-3 py-1 rounded-full font-bold hover:bg-fuchsia-700">＋ 追加</button>
                </div>
                {reasons.map((r) => (
                  <div key={r.id} className="bg-fuchsia-50/60 p-2 rounded space-y-2">
                    <div className="flex gap-2">
                      <input value={r.title} onChange={e => setReasons(prev => prev.map(x => x.id === r.id ? { ...x, title: e.target.value } : x))} placeholder="見出し" className="flex-1 p-2 border rounded text-sm font-bold" />
                      <button type="button" onClick={() => setReasons(prev => prev.filter(x => x.id !== r.id))} className="text-xs text-red-500 hover:underline whitespace-nowrap">削除</button>
                    </div>
                    <textarea value={r.body} onChange={e => setReasons(prev => prev.map(x => x.id === r.id ? { ...x, body: e.target.value } : x))} placeholder="本文" rows={2} className="w-full p-2 border rounded text-sm" />
                  </div>
                ))}
              </div>

              {/* ご利用の流れ */}
              <div className="bg-white p-4 rounded-lg border border-fuchsia-100 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-fuchsia-800">ご利用の流れ</h3>
                  <button type="button" onClick={() => setSteps(prev => [...prev, { id: crypto.randomUUID(), t: "", d: "" }])} className="text-xs bg-fuchsia-600 text-white px-3 py-1 rounded-full font-bold hover:bg-fuchsia-700">＋ 追加</button>
                </div>
                <p className="text-xs text-slate-500">未入力の場合は共通の「お問い合わせ→無料お見積り→日程の調整→作業・お支払い」が表示されます。</p>
                {steps.map((s, idx) => (
                  <div key={s.id} className="bg-fuchsia-50/60 p-2 rounded space-y-2">
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
                      <input value={s.t} onChange={e => setSteps(prev => prev.map(x => x.id === s.id ? { ...x, t: e.target.value } : x))} placeholder="見出し（例：お問い合わせ）" className="flex-1 p-2 border rounded text-sm font-bold" />
                      <button type="button" onClick={() => setSteps(prev => prev.filter(x => x.id !== s.id))} className="text-xs text-red-500 hover:underline whitespace-nowrap">削除</button>
                    </div>
                    <textarea value={s.d} onChange={e => setSteps(prev => prev.map(x => x.id === s.id ? { ...x, d: e.target.value } : x))} placeholder="説明" rows={2} className="w-full p-2 border rounded text-sm" />
                  </div>
                ))}
              </div>

              {/* FAQ（サービス詳細ページと連動） */}
              <div className="bg-white p-4 rounded-lg border border-fuchsia-100 space-y-2">
                <h3 className="text-sm font-bold text-fuchsia-800">よくあるご質問（サービス詳細ページと連動）</h3>
                <p className="text-[10px] text-slate-500">同じ作業内容のサービス詳細ページを選ぶと、そのページのFAQが常に最新の状態で表示されます。</p>
                {faqServicePageIds.length > 0 && (
                  <ul className="space-y-1">
                    {faqServicePageIds.map((id) => {
                      const sp = allServicePages.find((s) => s.id === id);
                      return (
                        <li key={id} className="flex items-center justify-between gap-2 bg-white border border-fuchsia-200 rounded-lg px-3 py-2 text-sm">
                          <span className="min-w-0 break-words">{sp?.title || "（読み込み中...）"}</span>
                          <button type="button" onClick={() => setFaqServicePageIds(prev => prev.filter(x => x !== id))} className="shrink-0 text-xs text-red-500 hover:underline">削除</button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2">
                  <select value={faqServicePageToAdd} onChange={e => setFaqServicePageToAdd(e.target.value)} className="flex-1 min-w-0 basis-full sm:basis-0 p-2 border rounded-lg text-sm">
                    <option value="">連動するサービス詳細ページを選択</option>
                    {allServicePages.filter((s) => !faqServicePageIds.includes(s.id)).map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => { if (faqServicePageToAdd) { setFaqServicePageIds(prev => [...prev, faqServicePageToAdd]); setFaqServicePageToAdd(""); } }} className="shrink-0 bg-fuchsia-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-fuchsia-700">＋ 追加</button>
                </div>
              </div>

              {/* FAQ（手入力） */}
              <div className="bg-white p-4 rounded-lg border border-fuchsia-100 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-fuchsia-800">よくあるご質問（手入力）</h3>
                  <button type="button" onClick={() => setRichFaqs(prev => [...prev, { id: crypto.randomUUID(), q: "", a: "" }])} className="text-xs bg-fuchsia-600 text-white px-3 py-1 rounded-full font-bold hover:bg-fuchsia-700">＋ 追加</button>
                </div>
                {richFaqs.map((f) => (
                  <div key={f.id} className="bg-fuchsia-50/60 p-2 rounded space-y-2">
                    <div className="flex gap-2">
                      <input value={f.q} onChange={e => setRichFaqs(prev => prev.map(x => x.id === f.id ? { ...x, q: e.target.value } : x))} placeholder="質問" className="flex-1 p-2 border rounded text-sm" />
                      <button type="button" onClick={() => setRichFaqs(prev => prev.filter(x => x.id !== f.id))} className="text-xs text-red-500 hover:underline whitespace-nowrap">削除</button>
                    </div>
                    <textarea value={f.a} onChange={e => setRichFaqs(prev => prev.map(x => x.id === f.id ? { ...x, a: e.target.value } : x))} placeholder="回答" rows={2} className="w-full p-2 border rounded text-sm" />
                  </div>
                ))}
              </div>

              {/* お客様の声 */}
              <div className="bg-white p-4 rounded-lg border border-fuchsia-100 space-y-2">
                <h3 className="text-sm font-bold text-fuchsia-800">お客様の声（サービス詳細ページと連動）</h3>
                <p className="text-[10px] text-slate-500">同じ作業内容のサービス詳細ページを選ぶと、そのページの口コミが常に最新の状態で表示されます。</p>
                {testimonialServicePageIds.length > 0 && (
                  <ul className="space-y-1">
                    {testimonialServicePageIds.map((id) => {
                      const sp = allServicePages.find((s) => s.id === id);
                      return (
                        <li key={id} className="flex items-center justify-between gap-2 bg-white border border-fuchsia-200 rounded-lg px-3 py-2 text-sm">
                          <span className="min-w-0 break-words">{sp?.title || "（読み込み中...）"}</span>
                          <button type="button" onClick={() => setTestimonialServicePageIds(prev => prev.filter(x => x !== id))} className="shrink-0 text-xs text-red-500 hover:underline">削除</button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2">
                  <select value={testimonialServicePageToAdd} onChange={e => setTestimonialServicePageToAdd(e.target.value)} className="flex-1 min-w-0 basis-full sm:basis-0 p-2 border rounded-lg text-sm">
                    <option value="">連動するサービス詳細ページを選択</option>
                    {allServicePages.filter((s) => !testimonialServicePageIds.includes(s.id)).map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => { if (testimonialServicePageToAdd) { setTestimonialServicePageIds(prev => [...prev, testimonialServicePageToAdd]); setTestimonialServicePageToAdd(""); } }} className="shrink-0 bg-fuchsia-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-fuchsia-700">＋ 追加</button>
                </div>
              </div>

              {/* お客様の声（手入力） */}
              <div className="bg-white p-4 rounded-lg border border-fuchsia-100 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-fuchsia-800">お客様の声（手入力）</h3>
                  <button type="button" onClick={() => setVoices(prev => [...prev, { id: crypto.randomUUID(), text: "", who: "", stars: 5 }])} className="text-xs bg-fuchsia-600 text-white px-3 py-1 rounded-full font-bold hover:bg-fuchsia-700">＋ 追加</button>
                </div>
                {voices.map((v) => (
                  <div key={v.id} className="bg-fuchsia-50/60 p-2 rounded space-y-2">
                    <div className="flex gap-2 items-center">
                      <input value={v.who} onChange={e => setVoices(prev => prev.map(x => x.id === v.id ? { ...x, who: e.target.value } : x))} placeholder="お客様の表示名（例：札幌市 / 40代）" className="flex-1 p-2 border rounded text-sm" />
                      <select value={v.stars} onChange={e => setVoices(prev => prev.map(x => x.id === v.id ? { ...x, stars: Number(e.target.value) } : x))} className="p-2 border rounded text-sm">
                        {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>★{n}</option>)}
                      </select>
                      <button type="button" onClick={() => setVoices(prev => prev.filter(x => x.id !== v.id))} className="text-xs text-red-500 hover:underline whitespace-nowrap">削除</button>
                    </div>
                    <textarea value={v.text} onChange={e => setVoices(prev => prev.map(x => x.id === v.id ? { ...x, text: e.target.value } : x))} placeholder="声の本文" rows={2} className="w-full p-2 border rounded text-sm" />
                  </div>
                ))}
              </div>

              {/* 施工事例（ビフォーアフター） */}
              <div className="bg-white p-4 rounded-lg border border-fuchsia-100 space-y-2">
                <h3 className="text-sm font-bold text-fuchsia-800">施工事例（ビフォーアフター）</h3>
                <p className="text-xs text-slate-500">/admin/before-after で登録済みの写真から選んで紐付けます。</p>
                {beforeAfterIds.length > 0 && (
                  <ul className="space-y-1">
                    {beforeAfterIds.map((id) => {
                      const ba = allBeforeAfters.find((b) => b.id === id);
                      return (
                        <li key={id} className="flex items-center justify-between bg-fuchsia-50/60 border border-fuchsia-100 rounded-lg px-3 py-2 text-sm">
                          <span>{ba?.title || "（読み込み中...）"}</span>
                          <button type="button" onClick={() => setBeforeAfterIds(prev => prev.filter(x => x !== id))} className="text-xs text-red-500 hover:underline">削除</button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="flex gap-2">
                  <select value={beforeAfterToAdd} onChange={e => setBeforeAfterToAdd(e.target.value)} className="flex-1 p-2 border rounded-lg text-sm">
                    <option value="">追加する施工事例を選択</option>
                    {allBeforeAfters.filter((b) => !beforeAfterIds.includes(b.id)).map((b) => (
                      <option key={b.id} value={b.id}>{b.title}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => { if (beforeAfterToAdd) { setBeforeAfterIds(prev => [...prev, beforeAfterToAdd]); setBeforeAfterToAdd(""); } }} className="bg-fuchsia-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-fuchsia-700">＋ 追加</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTAボタン */}
        <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div><label className="block text-sm font-bold text-gray-700 mb-1">ボタン文字</label>
          <input name="ctaText" value={formData.ctaText} onChange={handleChange} className="w-full p-2 border rounded" /></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-1">リンク先</label>
          <input name="ctaLink" value={formData.ctaLink} onChange={handleChange} className="w-full p-2 border rounded" /></div>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <button type="button" onClick={() => router.back()} className="flex-1 bg-gray-500 text-white py-3 rounded font-bold hover:bg-gray-600">キャンセル</button>
          <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700">{loading ? "保存中..." : "保存する"}</button>
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
