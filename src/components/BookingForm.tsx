// @/src/components/BookingForm.tsx
"use client";
import { useState } from "react";

export default function BookingForm({ initialCategory = "" }) {
  const [category, setCategory] = useState(initialCategory);
  
  // 1. カテゴリが未選択なら選択させるUI
  if (!category) {
    return (
      <div className="p-8 bg-white rounded-xl shadow-lg border">
        <h3 className="text-xl font-bold mb-4">サービスを選択してください</h3>
        <select onChange={(e) => setCategory(e.target.value)} className="w-full p-3 border rounded">
          <option value="">-- カテゴリを選んでください --</option>
          <option value="水回り">水回りクリーニング</option>
          <option value="ハウスクリーニング">ハウスクリーニング</option>
        </select>
      </div>
    );
  }

  // 2. カレンダーと予約入力のUI
  return (
    <div className="p-8 bg-white rounded-xl shadow-lg border">
      <h3 className="text-xl font-bold mb-4">{category} の空き状況</h3>
      {/* カレンダーを表示し、選択した時間に顧客情報を入力してPOSTするロジック */}
    </div>
  );
}