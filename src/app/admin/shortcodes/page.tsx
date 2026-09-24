// @/src/app/admin/shortcodes/page.tsx
// ショートコード管理：キーとHTMLを登録し、ブログ/LP本文に [[キー]] で貼れるようにする
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Shortcode = {
  id: string;
  key: string;
  name: string;
  html: string;
  updatedAt?: string;
};

const EMPTY = { id: "", key: "", name: "", html: "" };

export default function AdminShortcodesPage() {
  const [items, setItems] = useState<Shortcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Shortcode>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shortcodes");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const editing = !!form.id;

  const save = async () => {
    if (!form.key.trim()) { setMsg("キーを入力してください"); return; }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/shortcodes", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || "保存に失敗しました"); }
      else {
        setForm({ ...EMPTY });
        setMsg(editing ? "更新しました" : "作成しました");
        load();
      }
    } catch {
      setMsg("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, key: string) => {
    if (!window.confirm(`ショートコード [[${key}]] を削除します。よろしいですか？`)) return;
    try {
      const res = await fetch("/api/shortcodes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) { setItems((p) => p.filter((x) => x.id !== id)); if (form.id === id) setForm({ ...EMPTY }); }
      else alert("削除に失敗しました");
    } catch { alert("削除に失敗しました"); }
  };

  const copyTag = async (key: string) => {
    const tag = `[[${key}]]`;
    try { await navigator.clipboard.writeText(tag); setCopied(key); setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500); }
    catch { window.prompt("コピーしてください", tag); }
  };

  const inputCls = "w-full p-2 border rounded-lg text-sm";

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8 text-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">ショートコード管理</h1>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">← ダッシュボードへ</Link>
        </div>

        <p className="text-sm text-gray-600 mb-6 bg-white rounded-lg p-4 border">
          よく使うHTML（バナー・ボタン等）を登録して、ブログ記事やLPの本文に <code className="bg-gray-100 px-1 rounded">[[キー]]</code> と書くだけで貼れます。
          登録内容を直すと、貼った全ページに自動反映されます。※ショートコードは<b>段落（行）単体</b>で貼るのがおすすめです。
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 編集フォーム */}
          <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="font-bold text-gray-800 mb-3">{editing ? "編集" : "新規作成"}</h2>
            <label className="block text-xs text-gray-500 mb-1">キー（半角英数・ハイフン・アンダースコア）</label>
            <input className={inputCls + " mb-3"} placeholder="例：service-banner" value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })} />
            <label className="block text-xs text-gray-500 mb-1">名前（管理用メモ）</label>
            <input className={inputCls + " mb-3"} placeholder="例：サービス2枚バナー" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <label className="block text-xs text-gray-500 mb-1">HTML</label>
            <textarea className={inputCls + " font-mono text-xs h-56"} placeholder="<div>...</div>" value={form.html}
              onChange={(e) => setForm({ ...form, html: e.target.value })} />
            <div className="flex items-center gap-2 mt-3">
              <button onClick={save} disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
                {saving ? "保存中…" : editing ? "更新する" : "作成する"}
              </button>
              {editing && (
                <button onClick={() => setForm({ ...EMPTY })} className="px-4 py-2 rounded-lg border text-sm text-gray-600">
                  キャンセル（新規に戻す）
                </button>
              )}
              {msg && <span className="text-sm text-gray-600">{msg}</span>}
            </div>

            {/* プレビュー */}
            {form.html && (
              <div className="mt-5">
                <p className="text-xs text-gray-500 mb-1">プレビュー</p>
                <div className="border rounded-lg p-3 bg-slate-50 overflow-auto" dangerouslySetInnerHTML={{ __html: form.html }} />
              </div>
            )}
          </div>

          {/* 一覧 */}
          <div>
            {loading ? (
              <p className="text-gray-500 py-8 text-center">読み込み中…</p>
            ) : items.length === 0 ? (
              <p className="text-gray-500 py-8 text-center bg-white rounded-xl">まだショートコードがありません。</p>
            ) : (
              <div className="space-y-3">
                {items.map((it) => (
                  <div key={it.id} className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div>
                        <code className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">[[{it.key}]]</code>
                        <span className="text-xs text-gray-500 ml-2">{it.name}</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => copyTag(it.key)} className="text-xs font-bold py-1 px-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                          {copied === it.key ? "コピー済✓" : "コピー"}
                        </button>
                        <button onClick={() => setForm({ id: it.id, key: it.key, name: it.name, html: it.html })} className="text-xs font-bold py-1 px-2 rounded border">編集</button>
                        <button onClick={() => remove(it.id, it.key)} className="text-xs font-bold py-1 px-2 rounded bg-red-100 text-red-600 border border-red-200">削除</button>
                      </div>
                    </div>
                    <div className="border rounded-lg p-2 bg-slate-50 max-h-40 overflow-auto" dangerouslySetInnerHTML={{ __html: it.html }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
