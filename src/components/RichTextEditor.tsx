// @/src/components/RichTextEditor.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Node, mergeAttributes } from "@tiptap/core";

// details カスタムノード
const DetailsNode = Node.create({
  name: "details",
  group: "block",
  content: "detailsSummary detailsContent",
  defining: true,
  parseHTML() {
    return [{ tag: "details" }];
  },
renderHTML({ HTMLAttributes }) {
    return ["details", mergeAttributes(HTMLAttributes, { open: true }), 0];
},

});

const DetailsSummary = Node.create({
  name: "detailsSummary",
  group: "",
  content: "inline*",
  defining: true,
  parseHTML() {
    return [{ tag: "summary" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["summary", mergeAttributes(HTMLAttributes), 0];
  },
});

const DetailsContent = Node.create({
  name: "detailsContent",
  group: "",
  content: "block+",
  defining: true,
  parseHTML() {
    return [{ tag: "details > *:not(summary)", priority: 0 }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-details-content": "" }), 0];
  },
});

type Props = {
  value: string;
  onChange: (content: string) => void;
};

export default function RichTextEditor({ value, onChange }: Props) {
  const [htmlMode, setHtmlMode] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Image.configure({ inline: false }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "ここに本文を入力..." }),
      DetailsNode,
      DetailsSummary,
      DetailsContent,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });

    }
  }, [value]);

  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/lp/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        editor?.chain().focus().setImage({ src: url }).run();
      }
    };
  }, [editor]);

  const addLink = useCallback(() => {
    const url = prompt("URLを入力してください", "https://");
    if (!url) return;
    editor?.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const removeLink = useCallback(() => {
    editor?.chain().focus().unsetLink().run();
  }, [editor]);

  const insertDetails = useCallback(() => {
    const title = prompt("折り畳みのタイトルを入力してください", "クリックで開閉");
    if (!title) return;
    editor?.chain().focus().insertContent({
      type: "details",
      content: [
        { type: "detailsSummary", content: [{ type: "text", text: title }] },
        { type: "detailsContent", content: [{ type: "paragraph", content: [{ type: "text", text: "ここに内容を入力" }] }] },
      ],
    }).run();
  }, [editor]);

  const setColor = useCallback((color: string) => {
    editor?.chain().focus().setColor(color).run();
  }, [editor]);

  if (!editor) return <div className="h-64 w-full bg-slate-50 border rounded animate-pulse" />;

  return (
    <div className="bg-white rounded-md border border-slate-300 overflow-hidden min-h-[350px]">
      {/* ツールバー */}
      <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border-b">
        {/* サイズ */}
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 text-xs font-bold rounded ${editor.isActive("heading", { level: 2 }) ? "bg-blue-600 text-white" : "bg-white border"}`}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-2 py-1 text-xs font-bold rounded ${editor.isActive("heading", { level: 3 }) ? "bg-blue-600 text-white" : "bg-white border"}`}>H3</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} className={`px-2 py-1 text-xs font-bold rounded ${editor.isActive("heading", { level: 4 }) ? "bg-blue-600 text-white" : "bg-white border"}`}>H4</button>

        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

        {/* 文字装飾 */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 text-xs font-bold rounded ${editor.isActive("bold") ? "bg-blue-600 text-white" : "bg-white border"}`}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive("italic") ? "bg-blue-600 text-white" : "bg-white border"}`}><i>I</i></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive("underline") ? "bg-blue-600 text-white" : "bg-white border"}`}><u>U</u></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive("strike") ? "bg-blue-600 text-white" : "bg-white border"}`}><s>S</s></button>

        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

        {/* 色 */}
        <select onChange={(e) => setColor(e.target.value)} className="text-xs border rounded px-1 py-1 bg-white" defaultValue="">
          <option value="" disabled>色</option>
          <option value="#000000">黒</option>
          <option value="#ef4444">赤</option>
          <option value="#3b82f6">青</option>
          <option value="#22c55e">緑</option>
          <option value="#f97316">橙</option>
          <option value="#8b5cf6">紫</option>
        </select>

        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

        {/* リスト */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive("bulletList") ? "bg-blue-600 text-white" : "bg-white border"}`}>・リスト</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive("orderedList") ? "bg-blue-600 text-white" : "bg-white border"}`}>1.リスト</button>

        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

        {/* リンク・画像 */}
        <button type="button" onClick={addLink} className={`px-2 py-1 text-xs rounded ${editor.isActive("link") ? "bg-blue-600 text-white" : "bg-white border"}`}>🔗</button>
        {editor.isActive("link") && <button type="button" onClick={removeLink} className="px-2 py-1 text-xs rounded bg-red-100 text-red-600 border border-red-200">🔗✕</button>}
        <button type="button" onClick={addImage} className="px-2 py-1 text-xs rounded bg-white border">🖼</button>

        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

        {/* 折り畳み */}
        <button type="button" onClick={insertDetails} className="px-2 py-1 text-xs rounded bg-amber-500 text-white font-bold hover:bg-amber-600">▼ 折畳</button>

        {/* HTMLモード */}
        <button
          type="button"
          onClick={() => setHtmlMode(!htmlMode)}
          className={`px-2 py-1 text-xs rounded font-bold ml-auto ${htmlMode ? "bg-blue-600 text-white" : "bg-white border"}`}
        >
          {htmlMode ? "ビジュアル" : "HTML"}
        </button>
      </div>

      {/* エディタ本体 */}
      {htmlMode ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[300px] p-4 font-mono text-sm text-black outline-none resize-y"
          spellCheck={false}
        />
      ) : (
        <EditorContent editor={editor} />
      )}

      <style jsx global>{`
        .tiptap { min-height: 250px; padding: 16px; font-size: 16px; color: #000; outline: none; }
        .tiptap p { margin-bottom: 0.8em; }
        .tiptap h2 { font-size: 1.5em; font-weight: bold; margin: 1em 0 0.5em; }
        .tiptap h3 { font-size: 1.25em; font-weight: bold; margin: 1em 0 0.5em; }
        .tiptap h4 { font-size: 1.1em; font-weight: bold; margin: 1em 0 0.5em; }
        .tiptap ul { list-style: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .tiptap ol { list-style: decimal; padding-left: 1.5em; margin-bottom: 1em; }
        .tiptap a { color: #2563eb; text-decoration: underline; }
        .tiptap img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }
        .tiptap details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .tiptap details summary, .tiptap [data-details-content] summary { font-weight: bold; cursor: pointer; color: #1e40af; font-size: 1.1em; }
        .tiptap [data-details-content] { margin-top: 8px; }
        .tiptap p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #adb5bd; pointer-events: none; float: left; height: 0; }
      `}</style>
    </div>
  );
}
