// @/src/app/booking/page.tsx
"use client";

import { useState } from "react";
import BookingCalendar from "@/components/BookingCalendar";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const CATEGORIES = [
  "水回りクリーニング",
  "ハウスクリーニング",
  "ゴミ屋敷清掃",
  "遺品・生前整理",
  "特殊清掃",
  "床ワックス剥離・施工"
];

export default function BookingPage() {
  const [category, setCategory] = useState("");
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 予約フォーム送信処理
  const handleBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTime) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      category,
      name: formData.get("name"),
      email: formData.get("email"),
      tel: formData.get("tel"),
      startTime: selectedTime.toISOString(),
      endTime: new Date(selectedTime.getTime() + 60 * 60 * 1000).toISOString(), // 1時間枠
    };

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.ok) {
        alert("仮予約を受け付けました。担当者からの連絡をお待ちください。");
        location.reload();
      }
    } catch (e) {
      alert("エラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 text-black">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-10">Web予約（仮予約）</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* サイドバー: カテゴリ選択 */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="font-bold mb-4 border-b pb-2">1. サービスを選択</h2>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setCategory(cat); setSelectedTime(null); }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      category === cat ? "bg-blue-600 text-white shadow-md" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {selectedTime && (
              <div className="bg-blue-600 p-6 rounded-xl shadow-lg text-white animate-in slide-in-from-left duration-300">
                <h2 className="font-bold mb-2">選択中の日時</h2>
                <p className="text-2xl font-black">
                  {format(selectedTime, "M月d日(E)", { locale: ja })}
                </p>
                <p className="text-xl font-bold">
                  {format(selectedTime, "HH:00")} 〜
                </p>
              </div>
            )}
          </div>

          {/* メイン: カレンダー & フォーム */}
          <div className="lg:col-span-3 space-y-8">
            {!category ? (
              <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
                左側のメニューからサービスを選択してください
              </div>
            ) : !selectedTime ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                  ご希望の日時を選択してください
                </h2>
                <BookingCalendar category={category} onSelectSlot={setSelectedTime} />
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl shadow-md border animate-in fade-in duration-300">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                  お客様情報を入力（仮予約確定）
                </h2>
                <form onSubmit={handleBooking} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">お名前</label>
                    <input name="name" type="text" required className="w-full p-3 border rounded-lg bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">メールアドレス</label>
                    <input name="email" type="email" required className="w-full p-3 border rounded-lg bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">電話番号</label>
                    <input name="tel" type="tel" required className="w-full p-3 border rounded-lg bg-slate-50" />
                  </div>
                  <div className="md:col-span-2 flex gap-4 pt-4">
                    <button type="button" onClick={() => setSelectedTime(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl">戻る</button>
                    <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 disabled:bg-slate-400">
                      {isSubmitting ? "送信中..." : "仮予約を申し込む"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}