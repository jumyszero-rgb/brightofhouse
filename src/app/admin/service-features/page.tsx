// @/src/app/admin/service-features/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Feature = {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  imageUrl: string | null;
  link: string | null;
  order: number;
};

const COLOR_PRESETS = ["#0e7ad1", "#12b5a6", "#e5860b", "#7c5cff", "#16a34a", "#e0575b", "#ffd34e"];

type LinkTarget = { label: string; href: string };

export default function AdminServiceFeaturesPage() {
  const [items, setItems] = useState<Feature[]>([]);
  const [targets, setTargets] = useState<LinkTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    const d = await (await fetch("/api/service-features")).json();
    setItems(Array.isArray(d) ? d : []);
  };
  useEffect(() => {
    load();
    fetch("/api/link-targets")
      .then((r) => r.json())
      .then((d) => setTargets(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const setField = (id: string, field: keyof Feature, value: any) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const addNew = async () => {
    setLoading(true);
    setMessage("");
    try {
      await fetch("/api/service-features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "新しい分野", order: items.length }),
      });
      await load();
    } finally {
      setLoading(false);
    }
  };

  const save = async (f: Feature) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/service-features", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      if (!res.ok) throw new Error();
      setMessage("✅ 保存しました");
    } catch {
      setMessage("❌ 保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("この分野カードを削除しますか？")) return;
    setLoading(true);
    try {
      await fetch("/api/service-features", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await load();
    } finally {
      setLoading(false);
    }
  };

  // 並び替え：隣とorderを入れ替えて両方保存
  const move = async (idx: number, dir: "up" | "down") => {
    const j = dir === "up" ? idx - 1 : idx + 1;
    if (j < 0 || j >= items.length) return;
    const a = { ...items[idx] };
    const b = { ...items[j] };
    const ao = a.order;
    a.order = b.order;
    b.order = ao;
    setLoading(true);
    try {
      await fetch("/api/service-features", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a) });
      await fetch("/api/service-features", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
      await load();
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (id: string, file: File) => {
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/media", { method: "POST", body: fd });
      const d = await res.json();
      if (d.url) setField(id, "imageUrl", d.url);
      else alert("アップロードに失敗しました");
    } catch {
      alert("アップロードに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">トップ「おすすめ作業」カード管理</h1>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">← 戻る</Link>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          トップページの「おすすめ作業」カードを自由に追加・編集・削除・並び替えできます。背景画像・タイトル色・遷移先も設定可能です。
          <br />
          <span className="text-xs text-gray-400">※1件も無い場合は、既定の6分野が表示されます。</span>
        </p>

        <button onClick={addNew} disabled={loading} className="mb-6 bg-blue-600 text-white px-5 py-2 rounded font-bold text-sm">
          ＋ 分野を追加
        </button>

        <div className="space-y-5">
          {items.map((f, idx) => (
            <div key={f.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => move(idx, "up")} disabled={idx === 0 || loading} className="text-xs bg-gray-100 px-2 py-1 rounded disabled:opacity-40">↑</button>
                  <button onClick={() => move(idx, "down")} disabled={idx === items.length - 1 || loading} className="text-xs bg-gray-100 px-2 py-1 rounded disabled:opacity-40">↓</button>
                  <button onClick={() => remove(f.id)} disabled={loading} className="text-xs bg-red-500 text-white px-2 py-1 rounded font-bold">削除</button>
                </div>
              </div>

              <label className="block text-xs font-bold text-gray-500 mb-1">タイトル</label>
              <input className="w-full p-2 border rounded text-sm mb-3" value={f.title} onChange={(e) => setField(f.id, "title", e.target.value)} />

              <label className="block text-xs font-bold text-gray-500 mb-1">説明</label>
              <textarea className="w-full p-2 border rounded text-sm mb-3" rows={2} value={f.description || ""} onChange={(e) => setField(f.id, "description", e.target.value)} />

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">タイトル色</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PRESETS.map((c) => (
                      <button key={c} type="button" onClick={() => setField(f.id, "color", c)} className={`w-6 h-6 rounded-full border-2 ${f.color === c ? "border-black" : "border-white"}`} style={{ background: c }} />
                    ))}
                    <input type="text" placeholder="#0e7ad1" className="w-24 p-1 border rounded text-xs" value={f.color || ""} onChange={(e) => setField(f.id, "color", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">リンク先サービス（未設定は /service）</label>
                  <select
                    className="w-full p-2 border rounded text-sm"
                    value={targets.some((t) => t.href === f.link) ? (f.link || "") : (f.link ? "__manual__" : "")}
                    onChange={(e) => {
                      if (e.target.value === "__manual__") {
                        setField(f.id, "link", "/"); // 手動入力欄を表示（この値を編集）
                        return;
                      }
                      setField(f.id, "link", e.target.value || null);
                    }}
                  >
                    <option value="">（未設定：/service）</option>
                    {targets.map((t) => (
                      <option key={t.href} value={t.href}>{t.label}</option>
                    ))}
                    <option value="__manual__">手動で入力…</option>
                  </select>
                  {/* 一覧に無いURLを手動指定したい場合 */}
                  {f.link && !targets.some((t) => t.href === f.link) && (
                    <input
                      className="w-full p-2 border rounded text-sm mt-1"
                      placeholder="/service/xxx など"
                      value={f.link || ""}
                      onChange={(e) => setField(f.id, "link", e.target.value)}
                    />
                  )}
                </div>
              </div>

              <label className="block text-xs font-bold text-gray-500 mb-1">背景画像</label>
              {f.imageUrl && (
                <div className="relative inline-block mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.imageUrl} alt="" className="h-24 rounded border" />
                  <button type="button" onClick={() => setField(f.id, "imageUrl", null)} className="absolute top-1 right-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded">削除</button>
                </div>
              )}
              <input type="file" accept="image/*" className="text-xs block mb-3" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadImage(f.id, file); e.target.value = ""; }} />

              <button onClick={() => save(f)} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold">この分野を保存</button>
            </div>
          ))}
        </div>

        {message && <p className="text-center font-bold text-green-600 mt-6">{message}</p>}
      </div>
    </div>
  );
}
