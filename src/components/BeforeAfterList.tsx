// @/src/components/BeforeAfterList.tsx
"use client";

import { useState } from "react";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";

type Item = {
  id: string;
  title: string;
  description: string | null;
  beforeUrl: string;
  afterUrl: string;
  createdAt: Date;
};

export default function BeforeAfterList({ items }: { items: Item[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  // 検索フィルタリング
  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(term);
    const descMatch = item.description?.toLowerCase().includes(term) || false;
    return titleMatch || descMatch;
  });

  return (
    <div>
      {/* 検索ボックス */}
      <div className="max-w-md mx-auto mb-12 relative">
        <input
          type="text"
          placeholder="キーワードで検索（例: エアコン、キッチン）"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-full shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black"
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* リスト表示 (グリッドレイアウトでサイズ調整) */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12">
          {filteredItems.map((item) => (
            <section key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800 border-l-4 border-blue-500 pl-3">
                  {item.title}
                </h2>
                <span className="text-xs text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                </span>
              </div>
              
              {/* スライダー (親枠に合わせてリサイズされます) */}
              <div className="mb-4">
                <BeforeAfterSlider
                  beforeSrc={item.beforeUrl}
                  afterSrc={item.afterUrl}
                  alt={item.title}
                />
              </div>
              
              {/* 説明文 */}
              {item.description && (
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-slate-500">該当する実績が見つかりませんでした。</p>
        </div>
      )}
    </div>
  );
}