// @/src/app/blog/page.tsx
"use client"; // クライアントコンポーネント

import Link from "next/link";
import { useState, useEffect } from "react";

export default function BlogListPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPosts = async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.filter((post: any) => post.status === "PUBLISHED")); // 公開中の記事のみ
      }
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPosts(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  return (
    <main className="min-h-screen bg-slate-50 py-16 px-4 text-black">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">ブログ</h1>
          <p className="text-slate-600">プロが教えるお掃除の知恵袋</p>
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all">
                <div className="p-6">
                  <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded mb-4 inline-block">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  <h2 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-3">
                    {post.title}
                  </h2>
                  <div className="text-slate-500 text-sm line-clamp-3 mb-4 opacity-80" 
                    dangerouslySetInnerHTML={{ __html: post.content.replace(/<[^>]*>?/gm, '').substring(0, 100) }} 
                  />
                  <span className="text-blue-600 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                    続きを読む <span>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}