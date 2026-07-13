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
  category?: string | null;
};

export default function BeforeAfterList({ items }: { items: Item[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(items.map((i) => i.category).filter((c): c is string => !!c)));

  // カテゴリ・検索フィルタリング
  const filteredItems = items.filter((item) => {
    if (activeCategory && item.category !== activeCategory) return false;
    const term = searchTerm.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(term);
    const descMatch = item.description?.toLowerCase().includes(term) || false;
    return titleMatch || descMatch;
  });

  return (
    <div>
      {/* カテゴリ絞り込み */}
      {categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-all ${!activeCategory ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            すべて
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-all ${activeCategory === cat ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

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
                <div className="space-y-4">
                  {item.description.includes("【アフター】") ? (
                    <>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">BEFORE</span>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {item.description.split("【アフター】")[0].replace("【ビフォー】", "").trim()}
                        </p>
                      </div>
                      <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                        <span className="text-[10px] font-bold text-blue-400 block mb-1">AFTER</span>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {item.description.split("【アフター】")[1].trim()}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {item.description}
                    </p>
                  )}
                </div>
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