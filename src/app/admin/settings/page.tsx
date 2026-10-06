"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const FONT_CHOICES: { key: string; label: string; css: string }[] = [
  { key: "zen-maru", label: "Zen丸ゴシック（やわらか・現行）", css: "'Zen Maru Gothic', sans-serif" },
  { key: "zen-kaku", label: "Zen角ゴシック（モダン・きりっと）", css: "'Zen Kaku Gothic New', sans-serif" },
  { key: "noto-sans", label: "Noto Sans JP（標準・読みやすい）", css: "'Noto Sans JP', sans-serif" },
  { key: "mplus-rounded", label: "M PLUS Rounded（まるみ）", css: "'M PLUS Rounded 1c', sans-serif" },
  { key: "kosugi-maru", label: "小杉丸ゴシック（カジュアル）", css: "'Kosugi Maru', sans-serif" },
  { key: "shippori-mincho", label: "しっぽり明朝（上品・明朝体）", css: "'Shippori Mincho', serif" },
];

export default function AdminSettingsPage() {
  const [robotsTxt, setRobotsTxt] = useState("");
  const [reviewIpBlock, setReviewIpBlock] = useState(true);
  const [calendarStartHour, setCalendarStartHour] = useState(5);
  const [calendarEndHour, setCalendarEndHour] = useState(22);
  const [fontKey, setFontKey] = useState("zen-maru");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setRobotsTxt(data.robotsTxt || "");
        setReviewIpBlock(data.reviewIpBlock ?? true);
        setCalendarStartHour(data.calendarStartHour ?? 5);
        setCalendarEndHour(data.calendarEndHour ?? 22);
        setFontKey(data.fontKey || "zen-maru");
      });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ robotsTxt, reviewIpBlock, calendarStartHour, calendarEndHour, fontKey }),
    });
    if (res.ok) setMessage("✅ 保存しました");
    setLoading(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // プレビュー用にフォントを読み込む（この管理画面内だけ）
  useEffect(() => {
    const id = "admin-font-preview";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;700&family=Zen+Kaku+Gothic+New:wght@400;700&family=Noto+Sans+JP:wght@400;700&family=M+PLUS+Rounded+1c:wght@400;700&family=Kosugi+Maru&family=Shippori+Mincho:wght@400;700&display=swap";
    document.head.appendChild(link);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">SEO・サイト設定</h1>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">← 戻る</Link>
        </div>

        <div className="space-y-8">
          {/* robots.txt */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">robots.txt の内容</label>
            <textarea
              className="w-full h-64 p-4 font-mono text-sm border rounded bg-slate-50"
              value={robotsTxt}
              onChange={(e) => setRobotsTxt(e.target.value)}
            />
          </div>

          {/* サイトフォント */}
          <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-5">
            <h2 className="font-bold text-fuchsia-800 mb-1">🔤 サイトフォント</h2>
            <p className="text-xs text-slate-500 mb-4">サイト全体の文字フォントを変更します。保存後、ページを再読み込みすると反映されます。</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FONT_CHOICES.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFontKey(f.key)}
                  className={`text-left p-3 rounded-lg border-2 transition-colors ${fontKey === f.key ? "border-fuchsia-500 bg-white" : "border-slate-200 bg-white hover:border-fuchsia-300"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-4 h-4 rounded-full border-2 shrink-0 ${fontKey === f.key ? "border-fuchsia-500 bg-fuchsia-500" : "border-slate-300"}`} />
                    <span className="text-xs font-bold text-slate-600">{f.label}</span>
                  </div>
                  <div className="text-lg text-slate-900 leading-snug" style={{ fontFamily: f.css }}>
                    あいうアイウ 北海道ブライトオブハウス
                  </div>
                  <div className="text-sm text-slate-500" style={{ fontFamily: f.css }}>
                    水回りクリーニング 9,800円〜 ABCabc 0123
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* カレンダー表示時間帯 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h2 className="font-bold text-blue-800 mb-3">📅 カレンダー表示設定</h2>
            <p className="text-xs text-slate-500 mb-3">公開ページのカレンダーに表示する時間帯を設定します。この範囲外は「お気軽にご相談ください」と表示されます。</p>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1">開始時間</label>
                <select value={calendarStartHour} onChange={e => setCalendarStartHour(Number(e.target.value))} className="p-2 border rounded text-sm">
                  {hours.map(h => <option key={h} value={h}>{h}:00</option>)}
                </select>
              </div>
              <span className="text-lg font-bold text-slate-400 mt-4">〜</span>
              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1">終了時間</label>
                <select value={calendarEndHour} onChange={e => setCalendarEndHour(Number(e.target.value))} className="p-2 border rounded text-sm">
                  {hours.map(h => <option key={h} value={h}>{h}:00</option>)}
                </select>
              </div>
            </div>
            <p className="text-xs mt-2 font-bold text-center text-blue-600">
              現在：{calendarStartHour}:00 〜 {calendarEndHour}:00
            </p>
          </div>

          {/* アンケートIP制限 */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h2 className="font-bold text-amber-800 mb-3">📋 アンケートページ設定</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-700">IP制限（7日間の重複投稿ブロック）</p>
                <p className="text-xs text-slate-500 mt-1">OFFにするとテスト時に何度でも投稿できます</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewIpBlock(!reviewIpBlock)}
                className={`relative w-14 h-7 rounded-full transition-colors ${reviewIpBlock ? "bg-green-500" : "bg-slate-300"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${reviewIpBlock ? "translate-x-7" : "translate-x-0"}`} />
              </button>
            </div>
            <p className="text-xs mt-2 font-bold text-center">
              現在：<span className={reviewIpBlock ? "text-green-600" : "text-red-500"}>{reviewIpBlock ? "ON（制限あり）" : "OFF（制限なし・テストモード）"}</span>
            </p>
            <p className="text-xs text-slate-400 mt-2">
              アンケートURL：<a href="/review" target="_blank" className="text-blue-500 underline">brightofhouse.jp/review</a>
            </p>
          </div>

          <button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700">
            {loading ? "保存中..." : "設定を保存"}
          </button>
          {message && <p className="text-center font-bold text-green-600">{message}</p>}
        </div>
      </div>
    </div>
  );
}
