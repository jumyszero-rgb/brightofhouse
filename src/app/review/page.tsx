"use client";

import { useState, useEffect } from "react";

const GOOGLE_REVIEW_URL =
  "https://g.page/r/CXVJmOGCthLCEAE/review";

export default function ReviewPage() {
  const [phase, setPhase] = useState<
    "loading" | "blocked" | "rating" | "submitting" | "thankyou" | "redirect"
  >("loading");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    fetch("/api/review")
      .then((r) => r.json())
      .then((data) => setPhase(data.blocked ? "blocked" : "rating"))
      .catch(() => setPhase("rating"));
  }, []);

  const handleSubmit = async () => {
    if (selectedRating === 0) return;
    setPhase("submitting");
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: selectedRating }),
      });
      if (res.status === 429) { setPhase("blocked"); return; }
      if (selectedRating >= 4) { setPhase("redirect"); } else { setPhase("thankyou"); }
    } catch { setPhase("thankyou"); }
  };

  useEffect(() => {
    if (phase !== "redirect") return;
    if (countdown <= 0) { window.location.href = GOOGLE_REVIEW_URL; return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-sky-700">北海道ブライトオブハウス</h1>
          <p className="text-xs text-slate-400 mt-1">Hokkaido Bright of House</p>
        </div>
        {children}
      </div>
    </div>
  );

  if (phase === "loading") return <Wrapper><div className="text-center text-slate-400 py-20">読み込み中...</div></Wrapper>;

  if (phase === "blocked") return (
    <Wrapper>
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-4xl mb-4">🙏</p>
        <h2 className="text-lg font-bold text-slate-700 mb-2">アンケートは送信済みです</h2>
        <p className="text-sm text-slate-500">ご回答ありがとうございました。<br />またのご利用をお待ちしております。</p>
      </div>
    </Wrapper>
  );

  if (phase === "rating" || phase === "submitting") return (
    <Wrapper>
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-center text-lg font-bold text-slate-700 mb-2">サービスはいかがでしたか？</h2>
        <p className="text-center text-xs text-slate-400 mb-8">お客様のご意見をお聞かせください</p>
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onMouseEnter={() => setHoveredStar(n)} onMouseLeave={() => setHoveredStar(0)} onClick={() => setSelectedRating(n)} className="text-5xl transition-transform hover:scale-110 focus:outline-none" disabled={phase === "submitting"}>
              <span className={n <= (hoveredStar || selectedRating) ? "text-yellow-400 drop-shadow" : "text-slate-200"}>★</span>
            </button>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-300 px-2 mb-8">
          <span>不満</span><span>やや不満</span><span>普通</span><span>満足</span><span>大変満足</span>
        </div>
        <button onClick={handleSubmit} disabled={selectedRating === 0 || phase === "submitting"} className={`w-full py-4 rounded-xl font-bold text-white text-base transition ${selectedRating > 0 ? "bg-sky-600 hover:bg-sky-700 shadow-lg" : "bg-slate-300 cursor-not-allowed"}`}>
          {phase === "submitting" ? "送信中..." : "送信する"}
        </button>
      </div>
    </Wrapper>
  );

  if (phase === "thankyou") return (
    <Wrapper>
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-5xl mb-4">😊</p>
        <h2 className="text-lg font-bold text-slate-700 mb-3">ご回答ありがとうございました</h2>
        <p className="text-sm text-slate-500 leading-relaxed">貴重なご意見をいただきありがとうございます。<br />サービス改善に役立てさせていただきます。<br />またのご利用を心よりお待ちしております。</p>
        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">北海道ブライトオブハウス</p>
          <p className="text-xs text-slate-400">フリーダイヤル 0120-792-684</p>
        </div>
      </div>
    </Wrapper>
  );

  if (phase === "redirect") return (
    <Wrapper>
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-5xl mb-4">🌟</p>
        <h2 className="text-lg font-bold text-slate-700 mb-3">高評価ありがとうございます！</h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">よろしければ、Googleでも口コミをいただけると<br />大変励みになります。</p>
        <p className="text-3xl font-bold text-sky-600 mb-2">{countdown}</p>
        <p className="text-xs text-slate-400 mb-6">秒後にGoogleレビューページへ移動します</p>
        <a href={GOOGLE_REVIEW_URL} className="inline-block bg-sky-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-sky-700 transition shadow-lg">今すぐ口コミを書く</a>
      </div>
    </Wrapper>
  );

  return null;
}
