// @/src/components/RichTextEditor.tsx
"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(
  async () => {
    const mod = await import("react-quill-new");
    return (mod.default || mod) as any;
  },
  {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-slate-50 border rounded animate-pulse" />
  }
) as any;

type Props = {
  value: string;
  onChange: (content: string) => void;
};

export default function RichTextEditor({ value, onChange }: Props) {
  const modules = useMemo(() => ({
    toolbar: [
      [{ size: ["small", false, "large", "huge"] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
  }), []);

  return (
    <div className="bg-white rounded-md border border-slate-300 overflow-hidden min-h-[350px]">
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
      />
      {/* エディタ内のスタイル強制上書き */}
      <style jsx global>{`
        .ql-editor {
          min-height: 250px;
          font-size: 16px;
          color: #000000 !important; /* 入力文字を黒に固定 */
        }
        /* エディタ内のサイズ反映 */
        .ql-editor .ql-size-small { font-size: 0.75em; }
        .ql-editor .ql-size-large { font-size: 1.5em; }
        .ql-editor .ql-size-huge { font-size: 2.5em; }
      `}</style>
    </div>
  );
}