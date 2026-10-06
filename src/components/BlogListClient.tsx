"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type BlogCategory = { id: string; name: string; slug: string; _count?: { posts: number } };

export default function BlogListClient() {
  const [posts, setPosts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  // カテゴリ取得
  useEffect(() => {
    fetch("/api/blog/categories")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => {});
  }, []);

  // URLのcategoryパラメータを読み取り
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category") || "";
    if (cat) setActiveCategory(cat);
  }, []);

  const fetchPosts = async (query = "", category = "") => {
    setLoading(true);
    try {
      let url = `/api/blog?query=${encodeURIComponent(query)}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.filter((post: any) => post.status === "PUBLISHED"));
      }
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPosts(searchTerm, activeCategory);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, activeCategory]);

  // 検索・カテゴリを変えたら1ページ目に戻す
  useEffect(() => { setPage(1); }, [searchTerm, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const visiblePosts = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goPage = (p: number) => {
    // ページ送りで勝手に先頭へスクロールしない（カードの位置を保つ）
    setPage(Math.min(totalPages, Math.max(1, p)));
  };

  // 「↑ 最上部へ」ボタン（一定量スクロールしたら表示）
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCategoryClick = (slug: string) => {
    const newCat = activeCategory === slug ? "" : slug;
    setActiveCategory(newCat);
    // URLも更新（履歴に残す）
    const url = newCat ? `?category=${newCat}` : "/blog";
    window.history.pushState({}, "", url);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-16 px-4 text-black">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">ブログ</h1>
          <p className="text-slate-600">プロが教えるお掃除の知恵袋</p>
        </div>

        {/* カテゴリフィルター */}
        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => handleCategoryClick("")}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                activeCategory === ""
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              すべて
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeCategory === cat.slug
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat.name}
                {cat._count && <span className="ml-1 text-xs opacity-70">({cat._count.posts})</span>}
              </button>
            ))}
          </div>
        )}

        {/* 検索ボックス */}
        <div className="max-w-md mx-auto mb-12 relative">
          <input
            type="text"
            placeholder="キーワードで記事を検索（例: キッチン、カビ）"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-full shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
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

        {loading ? (
          <p className="text-center text-blue-600 py-20">記事を読み込み中...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-slate-500 py-20">該当する記事が見つかりませんでした。</p>
        ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visiblePosts.map((post) => {
              const coverImg = post.thumbnail || (post.content?.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]) || "";
              return (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group relative block aspect-square rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                {coverImg ? (
                  <img src={coverImg} alt={post.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-indigo-200 flex items-center justify-center text-6xl">🧹</div>
                )}
                {/* 文字を重ねるための黒グラデーション */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5" />
                {/* カテゴリ（上） */}
                {post.category && (
                  <span className="absolute top-3 left-3 text-[11px] font-bold bg-white/90 text-indigo-700 px-2.5 py-1 rounded-full shadow-sm">
                    {post.category.name}
                  </span>
                )}
                {/* タイトル・日付（下） */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <span className="text-[11px] font-medium opacity-90">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  <h2 className="text-base md:text-lg font-bold leading-snug line-clamp-3 drop-shadow mt-1 group-hover:underline">
                    {post.title}
                  </h2>
                </div>
              </Link>
              );
            })}
          </div>

          {/* ページング（6件ずつ） */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                onClick={() => goPage(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 rounded-full text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← 前へ
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => goPage(p)}
                    className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${
                      p === page
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => goPage(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-full text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                次へ →
              </button>
            </div>
          )}
          </>
        )}
      </div>
      {/* 最上部へ戻るボタン */}
      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="最上部へ戻る"
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 flex items-center justify-center text-xl font-bold transition-opacity"
        >
          ↑
        </button>
      )}
    </main>
  );
}
