// @/src/app/admin/hero/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Btn = { text: string; link: string };
type Stat = { big: string; sub: string };

const DEFAULT_BUTTONS: Btn[] = [
  { text: "無料で相談・見積り", link: "/contact" },
  { text: "サービス・料金を見る", link: "/service" },
  { text: "📞 0120-792-684", link: "tel:0120792684" },
];
const DEFAULT_BADGES: string[] = ["見積り無料・追加料金なし", "⭐ 口コミ★4.9（200件超）", "💰 札幌最安水準"];
const DEFAULT_STATS: Stat[] = [
  { big: "年間300件+", sub: "施工実績" },
  { big: "★4.9", sub: "口コミ評価" },
  { big: "最短即日", sub: "スピード対応" },
  { big: "年中無休", sub: "受付対応" },
];

export default function AdminHeroPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState<any>({
    title: "",
    subtitle: "",
    mobileHeight: "h-[50vh]",
    pcHeight: "md:h-[65vh]",
    heroImage: "",
  });
  const [buttons, setButtons] = useState<Btn[]>(DEFAULT_BUTTONS);
  const [badges, setBadges] = useState<string[]>(DEFAULT_BADGES);
  const [stats, setStats] = useState<Stat[]>(DEFAULT_STATS);

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => res.json())
      .then((data) => {
        setFormData({ ...data, heroImage: data.heroImage || "" });
        if (Array.isArray(data.buttons) && data.buttons.length) setButtons(data.buttons);
        if (Array.isArray(data.badges) && data.badges.length) setBadges(data.badges);
        if (Array.isArray(data.stats) && data.stats.length) setStats(data.stats);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const payload = {
        title: formData.title,
        subtitle: formData.subtitle,
        mobileHeight: formData.mobileHeight,
        pcHeight: formData.pcHeight,
        heroImage: formData.heroImage,
        buttons: buttons.filter((b) => b.text.trim() !== ""),
        badges: badges.filter((b) => b.trim() !== ""),
        stats: stats.filter((s) => s.big.trim() !== "" || s.sub.trim() !== ""),
      };
      const res = await fetch("/api/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      setMessage("✅ 更新しました");
    } catch {
      setMessage("❌ エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">ヒーローエリア設定</h1>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">← 戻る</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 高さ設定 */}
          <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">スマホ時の高さ</label>
              <select name="mobileHeight" value={formData.mobileHeight} onChange={handleChange} className="w-full p-2 border rounded text-black">
                <option value="h-[40vh]">小 (40%)</option>
                <option value="h-[50vh]">標準 (50%)</option>
                <option value="h-[60vh]">大 (60%)</option>
                <option value="h-[80vh]">特大 (80%)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">PC時の高さ</label>
              <select name="pcHeight" value={formData.pcHeight} onChange={handleChange} className="w-full p-2 border rounded text-black">
                <option value="md:h-[50vh]">小 (50%)</option>
                <option value="md:h-[65vh]">標準 (65%)</option>
                <option value="md:h-[80vh]">大 (80%)</option>
                <option value="md:h-screen">全画面 (100%)</option>
              </select>
            </div>
          </div>

          {/* ヒーロー背景画像 */}
          <div className="border rounded-lg p-4 bg-slate-50">
            <label className="block text-sm font-bold text-gray-700 mb-2">ヒーロー背景画像（任意）</label>
            {formData.heroImage && (
              <div className="relative mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formData.heroImage} alt="" className="w-full h-40 object-cover rounded" />
                <button type="button" onClick={() => setFormData((p: any) => ({ ...p, heroImage: "" }))} className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">削除</button>
              </div>
            )}
            <input type="file" accept="image/*" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const fd = new FormData();
              fd.append("file", f);
              try {
                const res = await fetch("/api/media", { method: "POST", body: fd });
                const data = await res.json();
                if (data.url) setFormData((p: any) => ({ ...p, heroImage: data.url }));
                else alert("アップロードに失敗しました");
              } catch { alert("アップロードに失敗しました"); }
              e.target.value = "";
            }} className="text-xs" />
            <p className="text-[11px] text-gray-400 mt-1">トップのヒーロー背景に表示されます（未設定ならグラデーション背景）。自動でWebP変換されます。</p>
          </div>

          {/* テキスト設定 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">メインタイトル</label>
            <input name="title" type="text" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded text-black" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">サブタイトル</label>
            <input name="subtitle" type="text" value={formData.subtitle} onChange={handleChange} className="w-full p-2 border rounded text-black" />
          </div>

          {/* ボタン（複数・追加可） */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-bold text-gray-700 mb-2">ボタン（上から順に表示・1つ目が一番目立つ色）</label>
            <p className="text-[11px] text-gray-400 mb-3">電話リンクにする場合は、リンク先を <code>tel:0120792684</code> のように入力してください。</p>
            <div className="space-y-2">
              {buttons.map((b, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                  <input type="text" placeholder="ボタン文言" value={b.text} onChange={(e) => setButtons((prev) => prev.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} className="flex-1 p-2 border rounded text-black text-sm" />
                  <input type="text" placeholder="/contact や tel:0120792684" value={b.link} onChange={(e) => setButtons((prev) => prev.map((x, j) => j === i ? { ...x, link: e.target.value } : x))} className="flex-1 p-2 border rounded text-black text-sm" />
                  <button type="button" onClick={() => setButtons((prev) => prev.filter((_, j) => j !== i))} className="text-red-500 text-xs font-bold">削除</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setButtons((prev) => [...prev, { text: "", link: "" }])} className="mt-2 text-sm text-blue-600 font-bold">＋ ボタンを追加</button>
          </div>

          {/* バッジ文言（追加可） */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-bold text-gray-700 mb-2">ボタン下のバッジ文言（追加可）</label>
            <div className="space-y-2">
              {badges.map((b, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" value={b} onChange={(e) => setBadges((prev) => prev.map((x, j) => j === i ? e.target.value : x))} className="flex-1 p-2 border rounded text-black text-sm" />
                  <button type="button" onClick={() => setBadges((prev) => prev.filter((_, j) => j !== i))} className="text-red-500 text-xs font-bold">削除</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setBadges((prev) => [...prev, ""])} className="mt-2 text-sm text-blue-600 font-bold">＋ バッジを追加</button>
          </div>

          {/* 実績バー（4項目・追加可） */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-bold text-gray-700 mb-2">実績バー（大きい文字＋小さい説明）</label>
            <div className="space-y-2">
              {stats.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" placeholder="例: 年間300件+" value={s.big} onChange={(e) => setStats((prev) => prev.map((x, j) => j === i ? { ...x, big: e.target.value } : x))} className="flex-1 p-2 border rounded text-black text-sm" />
                  <input type="text" placeholder="例: 施工実績" value={s.sub} onChange={(e) => setStats((prev) => prev.map((x, j) => j === i ? { ...x, sub: e.target.value } : x))} className="flex-1 p-2 border rounded text-black text-sm" />
                  <button type="button" onClick={() => setStats((prev) => prev.filter((_, j) => j !== i))} className="text-red-500 text-xs font-bold">削除</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setStats((prev) => [...prev, { big: "", sub: "" }])} className="mt-2 text-sm text-blue-600 font-bold">＋ 項目を追加</button>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-bold">
            {loading ? "保存中..." : "設定を保存"}
          </button>
          {message && <p className="text-center font-bold text-green-600">{message}</p>}
        </form>
      </div>
    </div>
  );
}
