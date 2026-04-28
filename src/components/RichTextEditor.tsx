// @/src/components/RichTextEditor.tsx
"use client";

import React, { useMemo, useRef } from "react";
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
  const quillRef = useRef<any>(null);

  // 画像アップロードのカスタムハンドラー
  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      const formData = new FormData();
      formData.append("image", file);

      // サーバーにアップロード
      const res = await fetch("/api/lp/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        // エディタ内の現在の位置に画像を挿入
        quill.insertEmbed(range.index, "image", url);
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image", "clean"],
      ],

      handlers: {
        image: imageHandler, // 画像ボタンにカスタム処理を紐付け
      },
    },
  }), []);

  return (
    <div className="bg-white rounded-md border border-slate-300 overflow-hidden min-h-[350px]">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
      />
      <style jsx global>{`
        .ql-editor { min-height: 250px; font-size: 16px; color: #000 !important; }
        .ql-editor img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }
        .ql-editor .ql-size-small { font-size: 0.75em; }
        .ql-editor .ql-size-large { font-size: 1.5em; }
        .ql-editor .ql-size-huge { font-size: 2.5em; }
      `}</style>
    </div>
  );
}