// @/src/components/lp/BlockNoteBody.tsx
// BlockNote（Notion風エディタ・段組み対応）のLP本文エディタ。
// クライアント専用。ビルダーからは next/dynamic の ssr:false 経由で読み込む。
// 保存時にHTMLも生成して渡す（公開ページはサーバー側でBlockNoteを読み込まず、このHTMLを描画する）。
"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { BlockNoteSchema } from "@blocknote/core";
import { withMultiColumn, multiColumnDropCursor } from "@blocknote/xl-multi-column";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";

type Props = {
  value?: any[];
  onChange: (data: { blocks: any[]; html: string }) => void;
};

export default function BlockNoteBody({ value, onChange }: Props) {
  const editor = useCreateBlockNote({
    schema: withMultiColumn(BlockNoteSchema.create()),
    dropCursor: multiColumnDropCursor,
    initialContent: Array.isArray(value) && value.length > 0 ? value : undefined,
  });

  const handleChange = async () => {
    const blocks = editor.document;
    let html = "";
    try {
      html = await editor.blocksToFullHTML(blocks);
    } catch {
      html = "";
    }
    onChange({ blocks, html });
  };

  return (
    <div className="bn-editor-wrap">
      <BlockNoteView editor={editor} theme="light" onChange={handleChange} />
    </div>
  );
}
