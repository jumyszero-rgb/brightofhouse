// @/src/app/admin/media/page.tsx
// R2 画像アップローダー＆画像管理
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";

type MediaItem = {
  key: string;
  url: string;
  size: number;
  lastModified: string | null;
};

function formatSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [prefix, setPrefix] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = prefix ? `?prefix=${encodeURIComponent(prefix)}` : "";
      const res = await fetch(`/api/media${q}`);
      const data = await res.json();
      setItems(data.items || []);
      if (data.folders) setFolders(data.folders);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [prefix]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setUploading(true);
    setProgress({ done: 0, total: list.length });
    for (let i = 0; i < list.length; i++) {
      const fd = new FormData();
      fd.append("file", list[i]);
      try {
        const res = await fetch("/api/media", { method: "POST", body: fd });
        if (!res.ok) console.error("upload failed", list[i].name);
      } catch (e) {
        console.error(e);
      }
      setProgress({ done: i + 1, total: list.length });
    }
    setUploading(false);
    setProgress(null);
    if (fileRef.current) fileRef.current.value = "";
    // アップロード後は Media フォルダを表示して確認しやすく
    if (prefix && prefix !== "Media") setPrefix("Media");
    else load();
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied((c) => (c === url ? null : c)), 1500);
    } catch {
      window.prompt("URLをコピーしてください", url);
    }
  };

  const remove = async (key: string) => {
    if (!window.confirm(`この画像を完全に削除します。よろしいですか？\n${key}`)) return;
    try {
      const res = await fetch("/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.key !== key));
      } else {
        alert("削除に失敗しました");
      }
    } catch {
      alert("削除に失敗しました");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8 text-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">画像アップロード・管理</h1>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">← ダッシュボードへ</Link>
        </div>

        {/* アップローダー */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <label
            className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl p-8 cursor-pointer hover:bg-blue-50 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading}
            />
            <div className="text-4xl mb-2">📤</div>
            <p className="font-bold text-gray-700">クリックまたはドラッグ＆ドロップで画像をアップロード</p>
            <p className="text-xs text-gray-500 mt-1">複数選択OK・自動でWebPに変換して軽量化します（最大1920px）</p>
          </label>
          {uploading && progress && (
            <p className="text-sm text-blue-600 mt-3 font-bold">
              アップロード中… {progress.done} / {progress.total}
            </p>
          )}
        </div>

        {/* フィルタ */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-gray-500">フォルダ:</span>
          <button
            onClick={() => setPrefix("")}
            className={`px-3 py-1 rounded-full text-sm font-bold border ${prefix === "" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700"}`}
          >すべて</button>
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => setPrefix(f + "/")}
              className={`px-3 py-1 rounded-full text-sm font-bold border ${prefix === f + "/" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700"}`}
            >{f}</button>
          ))}
          <button onClick={load} className="ml-auto px-3 py-1 rounded-full text-sm border bg-white text-gray-600 hover:bg-gray-50">🔄 更新</button>
        </div>

        {/* 一覧 */}
        {loading ? (
          <p className="text-gray-500 py-12 text-center">読み込み中…</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500 py-12 text-center">画像がありません。上のエリアからアップロードしてください。</p>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-2">{items.length} 件</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((it) => (
                <div key={it.key} className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.url} alt={it.key} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <p className="text-[11px] text-gray-500 break-all leading-tight">{it.key}</p>
                    <p className="text-[11px] text-gray-400">{formatSize(it.size)}</p>
                    <div className="mt-auto flex gap-2">
                      <button
                        onClick={() => copyUrl(it.url)}
                        className="flex-1 text-xs font-bold py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
                      >{copied === it.url ? "コピー済✓" : "URLコピー"}</button>
                      <button
                        onClick={() => remove(it.key)}
                        className="text-xs font-bold py-1.5 px-3 rounded bg-red-100 text-red-600 border border-red-200 hover:bg-red-200"
                      >削除</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
