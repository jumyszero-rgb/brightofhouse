// @/src/components/RichTextEditor.tsx
"use client";

import React, { useMemo, useRef, useState } from "react";
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
  const [htmlMode, setHtmlMode] = useState(false);

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

  const insertDetails = () => {
    const title = prompt("折り畳みのタイトルを入力してください", "クリックで開閉");
    if (!title) return;
    const detailsHtml = `\n<details>\n<summary>${title}</summary>\n<p>ここに内容を入力</p>\n</details>\n`;
    onChange(value + detailsHtml);
    if (!htmlMode) setHtmlMode(true);
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
        image: imageHandler,
      },
    },
  }), []);

  const formats = [
    "size", "bold", "italic", "underline", "strike",
    "color", "background", "list", "link", "image"
  ];

  return (
    <div className="bg-white rounded-md border border-slate-300 overflow-hidden min-h-[350px]">
      <div className="flex gap-2 p-2 bg-slate-100 border-b">
        <button
          type="button"
          onClick={() => setHtmlMode(!htmlMode)}
          className={`text-xs px-3 py-1 rounded font-bold transition-colors ${htmlMode ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'}`}
        >
          {htmlMode ? "ビジュアル編集に戻る" : "HTMLソース編集"}
        </button>
        <button
          type="button"
          onClick={insertDetails}
          className="text-xs px-3 py-1 rounded font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
        >
          ▼ 折り畳みを挿入
        </button>
      </div>

      {htmlMode ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[300px] p-4 font-mono text-sm text-black outline-none resize-y"
          spellCheck={false}
        />
      ) : (
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value || ""}
          onChange={onChange}
          modules={modules}
          formats={formats}
        />
      )}

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
