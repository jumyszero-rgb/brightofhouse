// @/src/components/lp/BlockNoteBody.tsx
// BlockNote（Notion風エディタ・段組み対応）のLP本文エディタ。
// クライアント専用。ビルダーからは next/dynamic の ssr:false 経由で読み込む。
"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { BlockNoteSchema } from "@blocknote/core";
import { withMultiColumn, multiColumnDropCursor } from "@blocknote/xl-multi-column";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";

type Props = {
  value?: any[];
  onChange: (blocks: any[]) => void;
};

export default function BlockNoteBody({ value, onChange }: Props) {
  const editor = useCreateBlockNote({
    schema: withMultiColumn(BlockNoteSchema.create()),
    dropCursor: multiColumnDropCursor,
    initialContent: Array.isArray(value) && value.length > 0 ? value : undefined,
  });

  return (
    <div className="bn-editor-wrap">
      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={() => onChange(editor.document)}
      />
    </div>
  );
}
