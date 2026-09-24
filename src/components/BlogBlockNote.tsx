// @/src/components/BlogBlockNote.tsx
// ブログ本文用 BlockNote エディター（Notion風・段組み対応）。
// - value: 既存のHTML文字列（従来記事もそのまま読み込める）
// - onChange: 編集内容をHTML文字列で返す（公開側はこのHTMLをそのまま描画）
// - 画像はR2にアップロード（/api/media, 自動WebP変換）
"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { BlockNoteSchema } from "@blocknote/core";
import { withMultiColumn, multiColumnDropCursor } from "@blocknote/xl-multi-column";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useEffect, useRef } from "react";

type Props = {
  value?: string;
  onChange: (html: string) => void;
};

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
    schema: withMultiColumn(BlockNoteSchema.create()),
    dropCursor: multiColumnDropCursor,
    uploadFile,
  });
  const loaded = useRef(false);

  // 初回のみ、既存HTMLをBlockNoteのブロックに変換して読み込む
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const html = (value || "").trim();
    if (!html) return;
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
  }, [editor]);

  const handleChange = async () => {
    let html = "";
    try {
      html = await editor.blocksToFullHTML(editor.document);
    } catch {
      html = "";
    }
    onChange(html);
  };

  return (
    <div className="bn-content border rounded-lg bg-white min-h-[400px]">
      <BlockNoteView editor={editor} theme="light" onChange={handleChange} />
    </div>
  );
}
