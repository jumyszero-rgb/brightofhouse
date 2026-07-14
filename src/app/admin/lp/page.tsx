// @/src/app/admin/lp/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminLPList() {
  const[lps, setLps] = useState<any[]>([]);

  const fetchLPs = async () => {
    const res = await fetch("/api/lp");
    if (res.ok) setLps(await res.json());
  };

  useEffect(() => {
    fetchLPs();
  },[]);

  const handleDelete = async (id: string) => {
    if (!confirm("本当に削除しますか？画像も消去されます。")) return;
    await fetch("/api/lp", { method: "DELETE", body: JSON.stringify({ id }) });
    fetchLPs();
  };

  const [duplicating, setDuplicating] = useState<string | null>(null);
  const handleDuplicate = async (lp: any) => {
    if (!confirm(`「${lp.title}」を複製しますか？`)) return;
    setDuplicating(lp.id);
    try {
      const res = await fetch(`/api/lp?id=${lp.id}`);
      const data = await res.json();

      const form = new FormData();
      form.set("slug", `${data.slug}-copy-${Date.now().toString().slice(-5)}`);
      form.set("title", `${data.title}（コピー）`);
      form.set("linkTitle", data.linkTitle || "");
      form.set("status", "DRAFT");
      form.set("category", data.category || "CAMPAIGN");
      form.set("showOnHome", "false");
      form.set("catchphrase", data.catchphrase || "");
      form.set("subCopy", data.subCopy || "");
      form.set("content", data.content || "");
      form.set("ctaText", data.ctaText || "");
      form.set("ctaLink", data.ctaLink || "");
      form.set("metaKeywords", data.metaKeywords || "");
      form.set("metaDescription", data.metaDescription || "");
      form.set("showBottomCta", String(data.showBottomCta !== false));
      form.set("noIndex", "true");
      form.set("canonicalUrl", "");
      form.set("existingHeroImage", data.heroImage || "");
      form.set("bookingMenuIds", JSON.stringify((data.bookingMenus || []).map((m: any) => m.id)));
      form.set("bookingCategoryIds", JSON.stringify((data.bookingCategories || []).map((c: any) => c.id)));
      form.set("bookingData", data.bookingData ? JSON.stringify(data.bookingData) : "");
      form.set("templateStyle", data.templateStyle || "SIMPLE");
      form.set("heroEyebrow", data.heroEyebrow || "");
      form.set("heroSubtitle", data.heroSubtitle || "");
      form.set("heroPriceLead", data.heroPriceLead || "");
      form.set("serviceLabel", data.serviceLabel || "");
      form.set("menuIntro", data.menuIntro || "");
      form.set("campaignBadge", data.campaignBadge || "");
      form.set("setNote", data.setNote || "");
      form.set("pains", JSON.stringify(data.pains || []));
      form.set("menuItems", JSON.stringify(data.menuItems || []));
      form.set("menuOptions", JSON.stringify(data.menuOptions || []));
      form.set("baseWork", JSON.stringify(data.baseWork || []));
      form.set("recommended", JSON.stringify(data.recommended || []));
      form.set("reasons", JSON.stringify(data.reasons || []));
      form.set("faqItems", JSON.stringify(data.faqItems || []));
      form.set("voices", JSON.stringify(data.voices || []));
      form.set("beforeAfterIds", JSON.stringify((data.beforeAfters || []).map((b: any) => b.id)));

      const createRes = await fetch("/api/lp", { method: "POST", body: form });
      if (!createRes.ok) throw new Error("複製に失敗しました");
      await fetchLPs();
    } catch (e: any) {
      alert(e.message || "複製に失敗しました");
    } finally {
      setDuplicating(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">LP（ランディングページ）管理</h1>
          <div className="flex gap-4">
            <Link href="/admin" className="text-sm bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">メニューへ戻る</Link>
            <Link href="/admin/lp/edit" className="text-sm bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">＋ 新規LP作成</Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 text-sm font-bold text-gray-600">状態</th>
                <th className="p-4 text-sm font-bold text-gray-600">タイトル / URL</th>
                <th className="p-4 text-sm font-bold text-gray-600">更新日</th>
                <th className="p-4 text-sm font-bold text-gray-600 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lps.map((lp) => (
                <tr key={lp.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${lp.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                      {lp.status === 'PUBLISHED' ? '公開中' : '下書き'}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{lp.title}</p>
                    <a href={`/lp/${lp.slug}`} target="_blank" className="text-xs text-blue-500 hover:underline">/lp/{lp.slug}</a>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(lp.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <a href={`/lp/${lp.slug}?preview=true`} target="_blank" className="bg-amber-100 text-amber-700 px-3 py-1 rounded text-xs font-bold hover:bg-amber-200">プレビュー</a>
                    <Link href={`/admin/lp/edit?id=${lp.id}`} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-bold hover:bg-blue-200">編集</Link>
                    <button onClick={() => handleDuplicate(lp)} disabled={duplicating === lp.id} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded text-xs font-bold hover:bg-emerald-200 disabled:opacity-50">{duplicating === lp.id ? "複製中..." : "複製"}</button>
                    <button onClick={() => handleDelete(lp.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-bold hover:bg-red-200">削除</button>
                  </td>
                </tr>
              ))}
              {lps.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">LPがありません。新規作成してください。</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}