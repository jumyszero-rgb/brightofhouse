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

      const res = await fetch("/api/lp/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        quill.insertEmbed(range.index, "image", url);
      }
    };
  };

  const detailsHandler = () => {
    const title = prompt("折り畳みのタイトルを入力してください", "クリックで開閉");
    if (!title) return;
    const quill = quillRef.current.getEditor();
    const range = quill.getSelection();
    const idx = range ? range.index : quill.getLength() - 1;

    const detailsHtml = `<details><summary>${title}</summary><p>ここに内容を入力</p></details>`;

    quill.clipboard.dangerouslyPasteHTML(idx, detailsHtml);
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image", "details", "clean"],
      ],
      handlers: {
        image: imageHandler,
        details: detailsHandler,
      },
    },
  }), []);

  const formats = [
    "size", "bold", "italic", "underline", "strike",
    "color", "background", "list", "link", "image"
  ];

  return (
    <div className="bg-white rounded-md border border-slate-300 overflow-hidden min-h-[350px]">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
      />
      <style jsx global>{`
        .ql-editor { min-height: 250px; font-size: 16px; color: #000 !important; }
        .ql-editor img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }
        .ql-editor .ql-size-small { font-size: 0.75em; }
        .ql-editor .ql-size-large { font-size: 1.5em; }
        .ql-editor .ql-size-huge { font-size: 2.5em; }
        .ql-editor details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin: 10px 0; }
        .ql-editor details summary { font-weight: bold; cursor: pointer; color: #1e40af; }
        .ql-snow .ql-toolbar button.ql-details { width: auto !important; padding: 0 8px !important; font-size: 12px; font-weight: bold; }
        .ql-snow .ql-toolbar button.ql-details::after { content: "▼折畳"; }
      `}</style>
    </div>
  );
}
