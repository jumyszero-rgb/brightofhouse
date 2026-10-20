// @/src/components/blog/BlogHtmlEditor.tsx
// ブログ本文「HTML」モード：生HTMLをそのまま貼って保存する（Tiptap / BlockNote を通さない）。
// 右（スマホでは下）に、公開ページと同じクラスでプレビューを表示する。
// 「🖼 画像を挿入」：画像をアップロード（/api/lp/upload・R2・WebP変換。Tiptapの画像ボタンと同じ処理）し、
//  カーソル位置に <figure> のHTMLを挿入する。
"use client";

import { useMemo, useRef, useState } from "react";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";
import CharCounter from "@/components/blog/CharCounter";
import { buildFigure } from "@/lib/blogFigure";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export default function BlogHtmlEditor({ value, onChange }: Props) {
  const [showPreview, setShowPreview] = useState(true);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // ボタンを押した時点のカーソル位置（ファイル選択中にフォーカスが外れても、ここに挿入する）
  const caretRef = useRef<{ start: number; end: number } | null>(null);

  // プレビューも保存時と同じサニタイズを通す（script / on* を除いた状態で確認できる）
  const previewHtml = useMemo(() => sanitizeBlogHtml(value || ""), [value]);

  const openFilePicker = () => {
    const ta = textareaRef.current;
    caretRef.current = ta
      ? { start: ta.selectionStart ?? value.length, end: ta.selectionEnd ?? value.length }
      : { start: value.length, end: value.length };
    fileRef.current?.click();
  };

  const insertAtCaret = (html: string) => {
    const pos = caretRef.current ?? { start: value.length, end: value.length };
    const before = value.slice(0, pos.start);
    const after = value.slice(pos.end);
    // 前後が行の途中なら改行を補って、タグが行頭から始まるようにする
    const pre = before && !before.endsWith("\n") ? "\n" : "";
    const post = after && !after.startsWith("\n") ? "\n" : "";
    const inserted = pre + html + post;
    onChange(before + inserted + after);
    // 挿入した直後にカーソルを移動
    const caret = before.length + inserted.length;
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(caret, caret);
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同じファイルを続けて選べるようにリセット
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/lp/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload failed");
      const { url } = await res.json();
      if (!url) throw new Error("no url");
      const caption = window.prompt("キャプション（空欄でなし）", "") ?? "";
      insertAtCaret(buildFigure(url, caption));
    } catch {
      alert("画像のアップロードに失敗しました。時間をおいて再度お試しください。");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-slate-500">
          HTMLをそのまま保存・表示します（&lt;script&gt; と onclick 等の属性だけ自動で取り除きます）。
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openFilePicker}
            disabled={uploading}
            className="text-xs font-bold px-3 py-1 rounded border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
          >
            {uploading ? "アップロード中..." : "🖼 画像を挿入"}
          </button>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-xs font-bold px-3 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100"
          >
            {showPreview ? "プレビューを隠す" : "プレビューを表示"}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      <div className={showPreview ? "grid grid-cols-1 xl:grid-cols-2 gap-4" : ""}>
        <textarea
          ref={textareaRef}
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
