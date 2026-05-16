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
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { Node, mergeAttributes, Extension } from "@tiptap/core";

// --- FontSize 拡張（自前実装） ---
const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [{
      types: ["textStyle"],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el) => el.style.fontSize || null,
          renderHTML: (attrs) => {
            if (!attrs.fontSize) return {};
            return { style: `font-size: ${attrs.fontSize}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: any) => {
        return chain().setMark("textStyle", { fontSize: size }).run();
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain().setMark("textStyle", { fontSize: null }).run();
      },
    } as any;
  },
});

// --- details カスタムノード ---
const DetailsNode = Node.create({
  name: "details",
  group: "block",
  content: "detailsSummary detailsContent",
  defining: true,
  parseHTML() { return [{ tag: "details" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["details", mergeAttributes(HTMLAttributes, { open: true }), 0];
  },
});

const DetailsSummary = Node.create({
  name: "detailsSummary",
  group: "",
  content: "inline*",
  defining: true,
  parseHTML() { return [{ tag: "summary" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["summary", mergeAttributes(HTMLAttributes), 0];
  },
});

const DetailsContent = Node.create({
  name: "detailsContent",
  group: "",
  content: "block+",
  defining: true,
  parseHTML() { return [{ tag: "details > *:not(summary)", priority: 0 }]; },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-details-content": "" }), 0];
  },
});

// --- 背景ボックス カスタムノード ---
const BoxBlock = Node.create({
  name: "boxBlock",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      boxType: { default: "info" },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-box-type]', getAttrs: (el: any) => ({ boxType: el.getAttribute("data-box-type") || "info" }) }];
  },
  renderHTML({ HTMLAttributes }) {
    const type = HTMLAttributes.boxType || "info";
    const styles: Record<string, string> = {
      info: "background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0;",
      warning: "background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:16px 0;",
      success: "background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;",
      danger: "background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;",
      gray: "background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;",
    };
    return ["div", mergeAttributes({ "data-box-type": type, style: styles[type] || styles.info }), 0];
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
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "ここに本文を入力..." }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      DetailsNode,
      DetailsSummary,
      DetailsContent,
      BoxBlock,
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

  const addTelLink = useCallback(() => {
    const tel = prompt("電話番号を入力（例: 0120-792-684）", "0120-792-684");
    if (!tel) return;
    const digits = tel.replace(/[^0-9]/g, "");
    editor?.chain().focus().setLink({ href: `tel:${digits}` }).run();
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

  const removeDetails = useCallback(() => {
    if (!editor) return;
    const { state } = editor;
    const { from } = state.selection;
    let detailsPos: number | null = null;
    let detailsNode: any = null;

    state.doc.descendants((node, pos) => {
      if (node.type.name === "details" && pos <= from && from <= pos + node.nodeSize) {
        detailsPos = pos;
        detailsNode = node;
        return false;
      }
    });

    if (detailsPos !== null && detailsNode) {
      const content: any[] = [];
      detailsNode.forEach((child: any) => {
        if (child.type.name === "detailsSummary") {
          content.push({ type: "paragraph", content: child.content.toJSON() || [] });
        } else if (child.type.name === "detailsContent") {
          child.forEach((block: any) => { content.push(block.toJSON()); });
        }
      });
      editor.chain().focus()
        .command(({ tr }) => {
          tr.replaceWith(detailsPos!, detailsPos! + detailsNode.nodeSize, content.map((c: any) => state.schema.nodeFromJSON(c)));
          return true;
        }).run();
    }
  }, [editor]);

  const insertCtaButton = useCallback(() => {
    const text = prompt("ボタンのテキストを入力", "無料お見積りはこちら");
    if (!text) return;
    const url = prompt("リンク先URLを入力", "/contact");
    if (!url) return;
    const align = prompt("配置（left / center / right）", "center") || "center";
    const color = prompt("ボタン色（red / blue / green / orange）", "red") || "red";

    const colorMap: Record<string, { bg: string; shadow: string }> = {
      red: { bg: "linear-gradient(135deg,#ef4444,#dc2626)", shadow: "0 6px 20px rgba(220,38,38,0.4)" },
      blue: { bg: "linear-gradient(135deg,#3b82f6,#2563eb)", shadow: "0 6px 20px rgba(37,99,235,0.4)" },
      green: { bg: "linear-gradient(135deg,#22c55e,#16a34a)", shadow: "0 6px 20px rgba(22,163,74,0.4)" },
      orange: { bg: "linear-gradient(135deg,#f97316,#ea580c)", shadow: "0 6px 20px rgba(234,88,12,0.4)" },
    };
    const c = colorMap[color] || colorMap.red;

    const html = `<div style="text-align:${align};margin:32px 0;"><a href="${url}" style="background:${c.bg};color:#fff;font-weight:900;font-size:1.15em;padding:18px 48px;border-radius:9999px;text-decoration:none;display:inline-block;box-shadow:${c.shadow};letter-spacing:0.05em;transition:transform 0.2s;">🔥 ${text}</a></div>`;

    editor?.chain().focus().insertContent(html).run();
  }, [editor]);

  const insertBox = useCallback((boxType: string) => {
    editor?.chain().focus().insertContent({
      type: "boxBlock",
      attrs: { boxType },
      content: [{ type: "paragraph", content: [{ type: "text", text: "ここにテキストを入力" }] }],
    }).run();
  }, [editor]);

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const setFontSize = useCallback((size: string) => {
    if (!editor) return;
    if (size === "") {
      (editor.chain().focus() as any).unsetFontSize().run();
    } else {
      (editor.chain().focus() as any).setFontSize(size).run();
    }
  }, [editor]);

  const setColor = useCallback((color: string) => {
    if (!editor) return;
    if (color === "unset") {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
  }, [editor]);

  if (!editor) return <div className="h-64 w-full bg-slate-50 border rounded animate-pulse" />;

  return (
    <div className="bg-white rounded-md border border-slate-300 overflow-hidden min-h-[350px]">
      {/* ツールバー */}
      <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border-b">

        {/* 見出し */}
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 text-xs font-bold rounded ${editor.isActive("heading", { level: 2 }) ? "bg-blue-600 text-white" : "bg-white border"}`}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-2 py-1 text-xs font-bold rounded ${editor.isActive("heading", { level: 3 }) ? "bg-blue-600 text-white" : "bg-white border"}`}>H3</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} className={`px-2 py-1 text-xs font-bold rounded ${editor.isActive("heading", { level: 4 }) ? "bg-blue-600 text-white" : "bg-white border"}`}>H4</button>

        {/* フォントサイズ */}
        <select onChange={(e) => setFontSize(e.target.value)} className="text-xs border rounded px-1 py-1 bg-white" defaultValue="">
          <option value="" disabled>サイズ</option>
          <option value="">標準</option>
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="20px">20px</option>
          <option value="24px">24px</option>
          <option value="28px">28px</option>
          <option value="32px">32px</option>
          <option value="36px">36px</option>
        </select>

        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

        {/* 文字装飾 */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 text-xs font-bold rounded ${editor.isActive("bold") ? "bg-blue-600 text-white" : "bg-white border"}`}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive("italic") ? "bg-blue-600 text-white" : "bg-white border"}`}><i>I</i></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive("underline") ? "bg-blue-600 text-white" : "bg-white border"}`}><u>U</u></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive("strike") ? "bg-blue-600 text-white" : "bg-white border"}`}><s>S</s></button>

        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

        {/* 文字色（リセット付き） */}
        <select
          onChange={(e) => { setColor(e.target.value); e.target.value = ""; }}
          className="text-xs border rounded px-1 py-1 bg-white"
          value=""
        >
          <option value="" disabled>文字色</option>
          <option value="unset">● リセット</option>
          <option value="#000000">● 黒</option>
          <option value="#ef4444">● 赤</option>
          <option value="#3b82f6">● 青</option>
          <option value="#22c55e">● 緑</option>
          <option value="#f97316">● 橙</option>
          <option value="#8b5cf6">● 紫</option>
          <option value="#ec4899">● ピンク</option>
          <option value="#6b7280">● グレー</option>
        </select>

        {/* 背景色 */}
        <select
          onChange={(e) => { editor.chain().focus().toggleHighlight({ color: e.target.value }).run(); e.target.value = ""; }}
          className="text-xs border rounded px-1 py-1 bg-white"
          value=""
        >
          <option value="" disabled>背景色</option>
          <option value="#fef08a">■ 黄</option>
          <option value="#bbf7d0">■ 緑</option>
          <option value="#bfdbfe">■ 青</option>
          <option value="#fecaca">■ 赤</option>
          <option value="#e9d5ff">■ 紫</option>
          <option value="#fed7aa">■ 橙</option>
        </select>

        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

        {/* リスト */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive("bulletList") ? "bg-blue-600 text-white" : "bg-white border"}`}>・リスト</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive("orderedList") ? "bg-blue-600 text-white" : "bg-white border"}`}>1.リスト</button>

        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

        {/* 配置 */}
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={`px-2 py-1 text-xs rounded ${editor.isActive({ textAlign: "left" }) ? "bg-blue-600 text-white" : "bg-white border"}`}>左</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={`px-2 py-1 text-xs rounded ${editor.isActive({ textAlign: "center" }) ? "bg-blue-600 text-white" : "bg-white border"}`}>中</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={`px-2 py-1 text-xs rounded ${editor.isActive({ textAlign: "right" }) ? "bg-blue-600 text-white" : "bg-white border"}`}>右</button>

        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

        {/* リンク */}
        <button type="button" onClick={addLink} className={`px-2 py-1 text-xs rounded ${editor.isActive("link") ? "bg-blue-600 text-white" : "bg-white border"}`}>🔗</button>
        {editor.isActive("link") && <button type="button" onClick={removeLink} className="px-2 py-1 text-xs rounded bg-red-100 text-red-600 border border-red-200">🔗✕</button>}
        <button type="button" onClick={addTelLink} className="px-2 py-1 text-xs rounded bg-green-600 text-white font-bold hover:bg-green-700">📞</button>
        <button type="button" onClick={addImage} className="px-2 py-1 text-xs rounded bg-white border">🖼</button>

        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

        {/* テーブル */}
        <button type="button" onClick={insertTable} className="px-2 py-1 text-xs rounded bg-white border font-bold">📊 表</button>
        {editor.isActive("table") && (
          <>
            <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-1 py-1 text-[10px] rounded bg-white border">列+</button>
            <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="px-1 py-1 text-[10px] rounded bg-white border">列-</button>
            <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="px-1 py-1 text-[10px] rounded bg-white border">行+</button>
            <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="px-1 py-1 text-[10px] rounded bg-white border">行-</button>
            <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="px-1 py-1 text-[10px] rounded bg-red-100 text-red-600 border border-red-200">表削除</button>
          </>
        )}

        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

        {/* ボックス装飾 */}
        <select
          onChange={(e) => { insertBox(e.target.value); e.target.value = ""; }}
          className="text-xs border rounded px-1 py-1 bg-white"
          value=""
        >
          <option value="" disabled>📦 装飾</option>
          <option value="info">ℹ️ 情報（青）</option>
          <option value="warning">⚠️ 注意（黄）</option>
          <option value="success">✅ 成功（緑）</option>
          <option value="danger">🚨 警告（赤）</option>
          <option value="gray">📝 メモ（灰）</option>
        </select>

        {/* 折り畳み */}
        <button type="button" onClick={insertDetails} className="px-2 py-1 text-xs rounded bg-amber-500 text-white font-bold hover:bg-amber-600">▼ 折畳</button>
        <button type="button" onClick={removeDetails} className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 border border-amber-300 font-bold">▼ 解除</button>

        {/* CTA */}
        <button type="button" onClick={insertCtaButton} className="px-2 py-1 text-xs rounded bg-red-600 text-white font-bold hover:bg-red-700">🔥 CTA</button>

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
        .tiptap details summary { font-weight: bold; cursor: pointer; color: #1e40af; font-size: 1.1em; }
        .tiptap [data-details-content] { margin-top: 8px; }
        .tiptap p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #adb5bd; pointer-events: none; float: left; height: 0; }

        /* テーブル */
        .tiptap table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        .tiptap th { background: #f1f5f9; font-weight: bold; text-align: left; }
        .tiptap th, .tiptap td { border: 1px solid #cbd5e1; padding: 8px 12px; min-width: 80px; vertical-align: top; }
        .tiptap td p, .tiptap th p { margin: 0; }

        /* ボックス装飾 */
        .tiptap div[data-box-type] { border-radius: 8px; padding: 16px; margin: 16px 0; }
        .tiptap div[data-box-type="info"] { background: #eff6ff; border: 1px solid #bfdbfe; }
        .tiptap div[data-box-type="warning"] { background: #fefce8; border: 1px solid #fde68a; }
        .tiptap div[data-box-type="success"] { background: #f0fdf4; border: 1px solid #bbf7d0; }
        .tiptap div[data-box-type="danger"] { background: #fef2f2; border: 1px solid #fecaca; }
        .tiptap div[data-box-type="gray"] { background: #f8fafc; border: 1px solid #e2e8f0; }
      `}</style>
    </div>
  );
}
