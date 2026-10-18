// @/src/components/blog/BlogHtmlEditor.tsx
// ブログ本文「HTML」モード：生HTMLをそのまま貼って保存する（Tiptap / BlockNote を通さない）。
// 右（スマホでは下）に、公開ページと同じクラスでプレビューを表示する。
"use client";

import { useMemo, useState } from "react";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";
import CharCounter from "@/components/blog/CharCounter";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export default function BlogHtmlEditor({ value, onChange }: Props) {
  const [showPreview, setShowPreview] = useState(true);
  // プレビューも保存時と同じサニタイズを通す（script / on* を除いた状態で確認できる）
  const previewHtml = useMemo(() => sanitizeBlogHtml(value || ""), [value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          HTMLをそのまま保存・表示します（&lt;script&gt; と onclick 等の属性だけ自動で取り除きます）。
        </p>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="text-xs font-bold px-3 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100"
        >
          {showPreview ? "プレビューを隠す" : "プレビューを表示"}
        </button>
      </div>

      <div className={showPreview ? "grid grid-cols-1 xl:grid-cols-2 gap-4" : ""}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="w-full min-h-[640px] p-3 border rounded-lg font-mono text-xs leading-relaxed bg-slate-900 text-slate-100"
          placeholder={"<h2>見出し</h2>\n<p>本文…</p>"}
        />
        {showPreview && (
          <div className="border rounded-lg bg-white overflow-auto max-h-[80vh]">
            <p className="text-[11px] font-bold text-slate-400 px-4 pt-3">プレビュー（公開ページと同じ表示）</p>
            <article className="px-4 py-4">
              <div
                className="bn-content ql-content blog-html prose prose-slate prose-base max-w-none text-slate-700 leading-loose"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </article>
          </div>
        )}
      </div>

      <CharCounter html={value} />
    </div>
  );
}
