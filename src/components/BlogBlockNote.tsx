// @/src/components/BlogBlockNote.tsx
// ブログ／サービス詳細 本文用 BlockNote エディター（Notion風・段組み対応）。
// - value: 既存のHTML文字列（従来記事もそのまま読み込める）
// - onChange: 編集内容をHTML文字列で返す（公開側はこのHTMLをそのまま描画）
// - 画像はR2にアップロード（/api/media, 自動WebP変換）
// - 文字サイズ: 見出し(H)を使わずに文字だけ大きく/小さくできるカスタムスタイルを追加
"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { BlockNoteSchema, defaultStyleSpecs } from "@blocknote/core";
import { withMultiColumn, multiColumnDropCursor } from "@blocknote/xl-multi-column";
import { useCreateBlockNote, createReactStyleSpec } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useEffect, useRef } from "react";

type Props = {
  value?: string;
  onChange: (html: string) => void;
};

// 文字サイズのカスタムスタイル（spanにfont-sizeを付与。見出しではないので太字にならない）
const FontSizeStyle = createReactStyleSpec(
  { type: "fontSize", propSchema: "string" },
  {
    render: (props) => (
      <span style={{ fontSize: props.value }} ref={props.contentRef} />
    ),
  }
);

// プリセット（em指定なので周囲に対する相対サイズ）
const SIZE_PRESETS: { label: string; value: string | null }[] = [
  { label: "小", value: "0.85em" },
  { label: "標準", value: null },
  { label: "大", value: "1.35em" },
  { label: "特大", value: "1.8em" },
];

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/media", { method: "POST", body: fd });
  if (!res.ok) throw new Error("upload failed");
  const data = await res.json();
  return data.url as string;
}

export default function BlogBlockNote({ value, onChange }: Props) {
  const editor = useCreateBlockNote({
    schema: withMultiColumn(
      BlockNoteSchema.create({
        styleSpecs: { ...defaultStyleSpecs, fontSize: FontSizeStyle },
      })
    ),
    dropCursor: multiColumnDropCursor,
    uploadFile,
  });
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    const html = (value || "").trim();
    if (!html) return;
    loaded.current = true;
    (async () => {
      try {
        const blocks = await editor.tryParseHTMLToBlocks(html);
        if (blocks && blocks.length > 0) {
          editor.replaceBlocks(editor.document, blocks);
        }
      } catch {
        // 変換に失敗しても空エディタで継続
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  const handleChange = async () => {
    let html = "";
    try {
      html = await editor.blocksToFullHTML(editor.document);
    } catch {
      html = "";
    }
    onChange(html);
  };

  const applySize = (v: string | null) => {
    try {
      if (v) {
        (editor as any).addStyles({ fontSize: v });
      } else {
        (editor as any).removeStyles({ fontSize: "" });
      }
      editor.focus();
    } catch {
      // 選択が無い等で失敗しても無視
    }
  };

  return (
    <div className="border rounded-lg bg-white">
      {/* 文字サイズツールバー（選択したテキストに適用） */}
      <div className="flex items-center gap-2 border-b bg-slate-50 px-3 py-2 flex-wrap">
        <span className="text-xs font-bold text-slate-500">文字サイズ:</span>
        {SIZE_PRESETS.map((s) => (
          <button
            key={s.label}
            type="button"
            onMouseDown={(e) => e.preventDefault() /* 選択を保持 */}
            onClick={() => applySize(s.value)}
            className="text-xs font-bold px-3 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100"
          >
            {s.label}
          </button>
        ))}
        <span className="text-[11px] text-slate-400">※文章を選択してから押してください（見出しにはなりません）</span>
      </div>
      <div className="bn-content min-h-[400px]">
        <BlockNoteView editor={editor} theme="light" onChange={handleChange} />
      </div>
    </div>
  );
}
