// @/src/app/admin/before-after/edit/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  mergeLegacyDescription,
  BA_SECTIONS,
  BA_INDEX_MIN_CHARS,
  BA_SLUG_RE,
  baTotalChars,
  baAutoDescription,
} from "@/lib/beforeAfterText";

// 単体ページ（/before-after/[slug]）用の入力欄
const EMPTY_PAGE = {
  slug: "",
  area: "",
  workName: "",
  reason: "",
  siteCondition: "",
  workDetail: "",
  workTimeStaff: "",
  price: "",
  staffComment: "",
  indexable: false,
  metaTitle: "",
  metaDescription: "",
};
type PageFields = typeof EMPTY_PAGE;

const SECTION_PLACEHOLDERS: Record<string, string> = {
  reason: "例：退去前に自分で掃除したが、排水口のニオイが取れず相談をいただきました。",
  siteCondition: "例：キッチン排水管の内側に油が固まり、流れが悪くなっていました。",
  workDetail: "例：トラップを外して分解洗浄し、高圧洗浄機で排水管の奥まで洗浄しました。",
  workTimeStaff: "例：約1時間・1名",
  price: "例：9,800円（税込）",
  staffComment: "例：油汚れは冬場に固まりやすいので、年1回の洗浄がおすすめです。",
};

function EditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<{ before: string; after: string }>({ before: "", after: "" });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    category: "",
  });
  const [page, setPage] = useState<PageFields>(EMPTY_PAGE);
  const setP = (k: keyof PageFields, v: string | boolean) => setPage((p) => ({ ...p, [k]: v }));
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
        // 旧形式（【ビフォー】…【アフター】…）が残っていても1つの文章として開く
        const desc = mergeLegacyDescription(target.description);

        setFormData({
          title: target.title,
          description: desc,
          date: new Date(target.createdAt).toISOString().split('T')[0],
          category: target.category || "",
        });
        setPage({
          slug: target.slug || "",
          area: target.area || "",
          workName: target.workName || "",
          reason: target.reason || "",
          siteCondition: target.siteCondition || "",
          workDetail: target.workDetail || "",
          workTimeStaff: target.workTimeStaff || "",
          price: target.price || "",
          staffComment: target.staffComment || "",
          indexable: !!target.indexable,
          metaTitle: target.metaTitle || "",
          metaDescription: target.metaDescription || "",
        });
        setPreview({
          before: target.beforeUrl,
          after: target.afterUrl,
        });
      }
    };
    fetchData();
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (page.slug.trim() && !BA_SLUG_RE.test(page.slug.trim().toLowerCase())) {
      setMessage("❌ スラッグは半角英小文字・数字・ハイフンで入力してください");
      return;
    }
    setLoading(true);
    setMessage("");

    const form = new FormData(e.currentTarget);
    if (editId) form.append("id", editId);

    form.set("description", formData.description.trim());
    form.set("category", formData.category);
    form.set("servicePageIds", JSON.stringify(servicePageIds));
    // 単体ページ用の項目
    for (const [k, v] of Object.entries(page)) form.set(k, typeof v === "boolean" ? String(v) : v.trim());

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

  // 本文の合計文字数（説明文＋各項目・空白改行を除く）
  const totalChars = baTotalChars({ description: formData.description, ...page });
  const slugInvalid = !!page.slug.trim() && !BA_SLUG_RE.test(page.slug.trim().toLowerCase());
  const autoDesc = baAutoDescription({ title: formData.title, description: formData.description, ...page });

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

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label className="block text-sm font-black text-slate-700 mb-2">説明文</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={10}
            className="w-full p-3 border rounded-lg text-sm leading-relaxed"
            placeholder={"作業前の状態、行った作業、仕上がりなどをまとめて書いてください。\n改行はそのまま表示されます。"}
          />
        </div>

        {/* ===== 単体ページ（/before-after/[slug]） ===== */}
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-5">
          <div>
            <h2 className="font-black text-amber-900">単体ページ（任意）</h2>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              スラッグを入れると、この事例の単体ページ（/before-after/スラッグ）ができ、一覧からリンクされます。
              空のままなら、今まで通り一覧にだけ表示されます。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-bold text-gray-700 mb-1">スラッグ（URL）</label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 whitespace-nowrap">/before-after/</span>
                <input
                  type="text"
                  value={page.slug}
                  onChange={(e) => setP("slug", e.target.value)}
                  placeholder="例：toyohira-drain-pipe-2026"
                  className={`flex-1 p-2 border rounded font-mono text-sm text-black ${slugInvalid ? "border-red-500 bg-red-50" : ""}`}
                />
              </div>
              <p className={`text-[11px] mt-1 ${slugInvalid ? "text-red-600 font-bold" : "text-gray-500"}`}>
                半角英小文字・数字・ハイフンのみ（例：地域-作業-年）。公開後に変えるとURLが変わるので注意してください。
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">エリア</label>
              <input type="text" value={page.area} onChange={(e) => setP("area", e.target.value)} placeholder="例：札幌市豊平区" className="w-full p-2 border rounded text-black" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">作業内容（短く）</label>
              <input type="text" value={page.workName} onChange={(e) => setP("workName", e.target.value)} placeholder="例：排水管高圧洗浄" className="w-full p-2 border rounded text-black" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BA_SECTIONS.map((sec) => (
              <div key={sec.key}>
                <label className="block text-sm font-bold text-gray-700 mb-1">{sec.label}</label>
                <textarea
                  value={page[sec.key]}
                  onChange={(e) => setP(sec.key, e.target.value)}
                  rows={sec.key === "workTimeStaff" || sec.key === "price" ? 2 : 4}
                  placeholder={SECTION_PLACEHOLDERS[sec.key]}
                  className="w-full p-2 border rounded text-sm leading-relaxed text-black"
                />
              </div>
            ))}
          </div>

          {/* 文字数と検索表示 */}
          <div className="bg-white border border-amber-200 rounded-lg p-4 space-y-3">
            <p className="text-sm">
              本文の合計文字数（説明文＋上の項目・空白改行を除く）：
              <span className={`font-black text-lg ml-1 ${totalChars >= BA_INDEX_MIN_CHARS ? "text-green-600" : "text-red-600"}`}>
                {totalChars.toLocaleString()}
              </span>{" "}
              字
            </p>
            <p className="text-xs text-gray-600">
              目安：<span className="font-bold">{BA_INDEX_MIN_CHARS}文字以上で「検索に表示する」をオン</span>にしてください。
              短い事例を検索に出すと、サイト全体の評価が下がる原因になります。
            </p>
            <label className={`flex items-center gap-2 text-sm font-bold ${page.slug.trim() ? "cursor-pointer" : "opacity-50"}`}>
              <input
                type="checkbox"
                checked={page.indexable}
                disabled={!page.slug.trim()}
                onChange={(e) => setP("indexable", e.target.checked)}
                className="w-5 h-5 accent-green-600"
              />
              検索に表示する（index・sitemap.xml に掲載）
            </label>
            {!page.slug.trim() && <p className="text-[11px] text-gray-500">※ スラッグを入れると選べます。</p>}
            {page.indexable && totalChars < BA_INDEX_MIN_CHARS && (
              <p className="text-xs text-red-600 font-bold">
                ⚠️ 本文が{BA_INDEX_MIN_CHARS}文字未満です。項目を書き足してからオンにするのがおすすめです。
              </p>
            )}
          </div>

          {/* 検索結果の表示（任意） */}
          <details className="bg-white border border-amber-200 rounded-lg p-4">
            <summary className="text-sm font-bold cursor-pointer">検索結果に出るタイトル・説明文（任意・空なら自動）</summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">タイトル（空ならタイトル欄を使用）</label>
                <input type="text" value={page.metaTitle} onChange={(e) => setP("metaTitle", e.target.value)} placeholder={formData.title} className="w-full p-2 border rounded text-sm text-black" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">説明文（空なら本文の先頭から自動）</label>
                <textarea value={page.metaDescription} onChange={(e) => setP("metaDescription", e.target.value)} rows={3} placeholder={autoDesc} className="w-full p-2 border rounded text-sm text-black" />
              </div>
            </div>
          </details>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
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