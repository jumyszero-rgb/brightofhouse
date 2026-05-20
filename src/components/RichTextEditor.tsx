// @/src/components/RichTextEditor.tsx
"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
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
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Node, mergeAttributes, Extension } from "@tiptap/core";

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

const ResizableImage = Node.create({
  name: "resizableImage",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: "100%" },
      caption: { default: "" },
      float: { default: "none" },
    };
  },
  parseHTML() {
    return [
      {
        tag: "figure[data-resizable-image]",
        getAttrs: (el: any) => ({
          src: el.querySelector("img")?.getAttribute("src"),
          alt: el.querySelector("img")?.getAttribute("alt"),
          width: el.querySelector("img")?.style.width || el.getAttribute("data-width") || "100%",
          caption: el.querySelector("figcaption")?.textContent || "",
          float: el.getAttribute("data-float") || "none",
        }),
      },
      {
        tag: "img[src]",
        getAttrs: (el: any) => ({
          src: el.getAttribute("src"),
          alt: el.getAttribute("alt"),
          width: el.style.width || "100%",
          caption: "",
          float: "none",
        }),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const { src, alt, width, caption, float: f } = HTMLAttributes;
    const floatStyle = f === "left" ? "float:left;margin-right:16px;" : f === "right" ? "float:right;margin-left:16px;" : "";
    const figureAttrs: any = {
      "data-resizable-image": "",
      "data-width": width,
      "data-float": f || "none",
      style: `${floatStyle}width:${width};margin:10px 0;`,
    };
    if (caption) {
      return ["figure", figureAttrs,
        ["img", { src, alt: alt || "", style: "width:100%;height:auto;border-radius:8px;" }],
        ["figcaption", { style: "text-align:center;font-size:0.85em;color:#6b7280;margin-top:6px;" }, caption],
      ];
    }
    return ["figure", figureAttrs,
      ["img", { src, alt: alt || "", style: "width:100%;height:auto;border-radius:8px;" }],
    ];
  },
});

const ImageRow = Node.create({
  name: "imageRow",
  group: "block",
  content: "resizableImage+",
  parseHTML() { return [{ tag: "div[data-image-row]" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, {
      "data-image-row": "",
      style: "display:flex;gap:16px;margin:16px 0;flex-wrap:wrap;",
    }), 0];
  },
});

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

const BoxBlock = Node.create({
  name: "boxBlock",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return { boxType: { default: "info" } };
  },
  parseHTML() {
    return [{ tag: "div[data-box-type]", getAttrs: (el: any) => ({ boxType: el.getAttribute("data-box-type") || "info" }) }];
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

const BalloonBlock = Node.create({
  name: "balloonBlock",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      direction: { default: "left" },
      name: { default: "" },
      avatar: { default: "" },
      color: { default: "#e0f2fe" },
    };
  },
  parseHTML() {
    return [{
      tag: "div[data-balloon]",
      getAttrs: (el: any) => ({
        direction: el.getAttribute("data-balloon-dir") || "left",
        name: el.getAttribute("data-balloon-name") || "",
        avatar: el.getAttribute("data-balloon-avatar") || "",
        color: el.getAttribute("data-balloon-color") || "#e0f2fe",
      }),
    }];
  },
  renderHTML({ HTMLAttributes }) {
    const { direction, name, avatar, color } = HTMLAttributes;
    const isLeft = direction === "left";
    return ["div", {
      "data-balloon": "",
      "data-balloon-dir": direction,
      "data-balloon-name": name,
      "data-balloon-avatar": avatar,
      "data-balloon-color": color,
      style: `display:flex;gap:12px;margin:16px 0;align-items:flex-start;${isLeft ? "" : "flex-direction:row-reverse;"}`,
    },
      ["div", { style: "flex-shrink:0;text-align:center;" },
        ...(avatar ? [["img", { src: avatar, style: "width:48px;height:48px;border-radius:50%;object-fit:cover;" }]] : [["div", { style: "width:48px;height:48px;border-radius:50%;background:#cbd5e1;display:flex;align-items:center;justify-content:center;font-size:20px;" }, "👤"]]),
        ...(name ? [["div", { style: "font-size:11px;font-weight:bold;color:#64748b;margin-top:4px;" }, name]] : []),
      ],
      ["div", {
        style: `background:${color};border-radius:12px;padding:12px 16px;max-width:75%;position:relative;`,
      }, 0],
    ];
  },
});
const RawHtmlBlock = Node.create({
  name: "rawHtmlBlock",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      content: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-raw-html]", getAttrs: (el: any) => ({ content: el.innerHTML }) }];
  },
  renderHTML({ HTMLAttributes }) {
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-raw-html", "true");
    wrapper.setAttribute("contenteditable", "false");
    wrapper.style.cssText = "margin:32px 0;";
    wrapper.innerHTML = HTMLAttributes.content || "";
    return { dom: wrapper };
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.setAttribute("data-raw-html", "true");
      dom.setAttribute("contenteditable", "false");
      dom.style.cssText = "margin:32px 0;cursor:pointer;";
      dom.innerHTML = node.attrs.content || "";
      dom.addEventListener("click", () => { dom.style.outline = "2px solid #3b82f6"; setTimeout(() => { dom.style.outline = ""; }, 1500); });
      return { dom };
    };
  },
});

type Props = {
  value: string;
  onChange: (content: string) => void;
};

export default function RichTextEditor({ value, onChange }: Props) {
  const [htmlMode, setHtmlMode] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [headings, setHeadings] = useState<{ level: number; text: string; pos: number }[]>([]);
  const [showCtaModal, setShowCtaModal] = useState(false);
  const [ctaBlocks, setCtaBlocks] = useState<any[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Image.configure({ inline: false }),
      ResizableImage,
      ImageRow,
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
      BalloonBlock,
      RawHtmlBlock,
    ],

    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      updateHeadings(editor);
    },
  });

  const updateHeadings = useCallback((ed: any) => {
    if (!ed) return;
    const h: { level: number; text: string; pos: number }[] = [];
    ed.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === "heading") {
        h.push({ level: node.attrs.level, text: node.textContent, pos });
      }
    });
    setHeadings(h);
  }, []);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value]);

  useEffect(() => {
    if (editor) updateHeadings(editor);
  }, [editor]);

  const jumpToPos = useCallback((pos: number) => {
    if (!editor) return;
    editor.chain().focus().setTextSelection(pos).run();
    const domAtPos = editor.view.domAtPos(pos);
    if (domAtPos?.node) {
      const el = domAtPos.node instanceof HTMLElement ? domAtPos.node : domAtPos.node.parentElement;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [editor]);

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
        const width = prompt("画像の幅（例: 100%, 50%, 300px）", "100%") || "100%";
        const caption = prompt("キャプション（空欄でなし）", "") || "";
        editor?.chain().focus().insertContent({
          type: "resizableImage",
          attrs: { src: url, width, caption, float: "none" },
        }).run();
      }
    };
  }, [editor]);

  const insertImageRow = useCallback(() => {
    if (!editor) return;
    const count = parseInt(prompt("横に並べる画像の数（2〜4）", "2") || "2", 10);
    if (count < 2 || count > 4) return alert("2〜4を入力してください");
    const images: any[] = [];
    const w = `${Math.floor(100 / count)}%`;
    const pickImage = (idx: number) => {
      return new Promise<void>((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.click();
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) { resolve(); return; }
          const formData = new FormData();
          formData.append("image", file);
          const res = await fetch("/api/lp/upload", { method: "POST", body: formData });
          if (res.ok) {
            const { url } = await res.json();
            const caption = prompt(`画像${idx + 1}のキャプション（空欄でなし）`, "") || "";
            images.push({ type: "resizableImage", attrs: { src: url, width: w, caption, float: "none" } });
          }
          resolve();
        };
      });
    };
    (async () => {
      for (let i = 0; i < count; i++) {
        await pickImage(i);
      }
      if (images.length > 0) {
        editor.chain().focus().insertContent({
          type: "imageRow",
          content: images,
        }).run();
      }
    })();
  }, [editor]);

  const changeImageSize = useCallback(() => {
    if (!editor) return;
    const { state } = editor;
    const { from } = state.selection;
    let found = false;
    state.doc.descendants((node, pos) => {
      if (found) return false;
      if (node.type.name === "resizableImage" && pos <= from && from <= pos + node.nodeSize) {
        const newWidth = prompt("新しい幅（例: 50%, 300px, 100%）", node.attrs.width || "100%");
        if (newWidth) {
          const tr = state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, width: newWidth });
          editor.view.dispatch(tr);
        }
        found = true;
        return false;
      }
    });
    if (!found) alert("画像を選択してからクリックしてください");
  }, [editor]);

  const changeImageCaption = useCallback(() => {
    if (!editor) return;
    const { state } = editor;
    const { from } = state.selection;
    let found = false;
    state.doc.descendants((node, pos) => {
      if (found) return false;
      if (node.type.name === "resizableImage" && pos <= from && from <= pos + node.nodeSize) {
        const newCaption = prompt("キャプションを入力（空欄で削除）", node.attrs.caption || "");
        const tr = state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, caption: newCaption || "" });
        editor.view.dispatch(tr);
        found = true;
        return false;
      }
    });
    if (!found) alert("画像を選択してからクリックしてください");
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
      editor.chain().focus().command(({ tr }) => {
        tr.replaceWith(detailsPos!, detailsPos! + detailsNode.nodeSize, content.map((c: any) => state.schema.nodeFromJSON(c)));
        return true;
      }).run();
    }
  }, [editor]);

  const openCtaModal = useCallback(async () => {
    try {
      const res = await fetch("/api/cta-blocks");
      if (res.ok) setCtaBlocks(await res.json());
    } catch {}
    setShowCtaModal(true);
  }, []);

  const insertCtaHtml = useCallback((block: any) => {
    const bg = block.bgType === "gradient" && block.bgColor2
      ? `background:linear-gradient(135deg,${block.bgColor1},${block.bgColor2})`
      : `background-color:${block.bgColor1}`;
    let html = `<div style="${bg};border:1px solid ${block.borderColor};border-radius:${block.borderRadius}px;padding:${block.paddingY}px ${block.paddingX}px;text-align:center;margin:32px 0;">`;
    if (block.headingText) html += `<div style="color:${block.headingColor};font-size:${block.headingSize}px;font-weight:${block.headingWeight};margin-bottom:12px;">${block.headingText}</div>`;
    if (block.desc1Text) html += `<div style="color:${block.desc1Color};font-size:${block.desc1Size}px;font-weight:${block.desc1Weight};margin-bottom:12px;white-space:pre-line;line-height:1.8;">${block.desc1Text}</div>`;
    if (block.linkText && block.linkUrl) html += `<div style="margin-bottom:12px;"><a href="${block.linkUrl}" style="color:${block.linkColor};font-size:${block.linkSize}px;font-weight:${block.linkWeight};text-decoration:underline;">${block.linkText}</a></div>`;
    if (block.desc2Text) html += `<div style="color:${block.desc2Color};font-size:${block.desc2Size}px;font-weight:${block.desc2Weight};margin-bottom:12px;white-space:pre-line;line-height:1.8;">${block.desc2Text}</div>`;
    if (block.btn1Text && block.btn1Url) html += `<div style="margin-bottom:12px;"><a href="${block.btn1Url}" style="background:${block.btn1BgColor};color:${block.btn1TextColor};font-size:${block.btn1Size}px;font-weight:${block.btn1Weight};padding:${block.btn1PaddingY}px ${block.btn1PaddingX}px;border-radius:${block.btn1Radius}px;display:inline-block;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,0.15);">${block.btn1Text}</a></div>`;
    if (block.desc3Text) html += `<div style="color:${block.desc3Color};font-size:${block.desc3Size}px;font-weight:${block.desc3Weight};margin-bottom:12px;white-space:pre-line;line-height:1.8;">${block.desc3Text}</div>`;
    if (block.btn2Text && block.btn2Url) html += `<div style="margin-bottom:12px;"><a href="${block.btn2Url}" style="background:${block.btn2BgColor};color:${block.btn2TextColor};font-size:${block.btn2Size}px;font-weight:${block.btn2Weight};padding:${block.btn1PaddingY}px ${block.btn1PaddingX}px;border-radius:${block.btn1Radius}px;display:inline-block;text-decoration:none;">${block.btn2Text}</a></div>`;
    if (block.desc4Text) html += `<div style="color:${block.desc4Color};font-size:${block.desc4Size}px;font-weight:${block.desc4Weight};margin-bottom:12px;white-space:pre-line;line-height:1.8;">${block.desc4Text}</div>`;
    if (block.telText && block.telNumber) html += `<div><a href="tel:${block.telNumber}" style="color:${block.telColor};font-size:${block.telSize}px;font-weight:${block.telWeight};text-decoration:none;">📞 ${block.telText}</a></div>`;
       html += `</div>`;
    editor?.chain().focus().insertContent({
      type: "rawHtmlBlock",
      attrs: { content: html },
    }).run();
    setShowCtaModal(false);
  }, [editor]);





  const insertBox = useCallback((boxType: string) => {
    editor?.chain().focus().insertContent({
      type: "boxBlock",
      attrs: { boxType },
      content: [{ type: "paragraph", content: [{ type: "text", text: "ここにテキストを入力" }] }],
    }).run();
  }, [editor]);

  const insertBalloon = useCallback(() => {
    const direction = prompt("吹き出しの向き（left / right）", "left") || "left";
    const name = prompt("名前（空欄でなし）", "") || "";
    const avatar = prompt("アバター画像URL（空欄でデフォルト）", "") || "";
    const colorChoice = prompt("吹き出し色（blue / green / pink / gray）", "blue") || "blue";
    const colorMap: Record<string, string> = {
      blue: "#e0f2fe",
      green: "#dcfce7",
      pink: "#fce7f3",
      gray: "#f1f5f9",
    };
    const color = colorMap[colorChoice] || colorMap.blue;
    editor?.chain().focus().insertContent({
      type: "balloonBlock",
      attrs: { direction, name, avatar, color },
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
    <div className="bg-white rounded-md border border-slate-300 overflow-hidden min-h-[350px]" ref={editorRef}>
      {/* ツールバー1段目 */}
      <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border-b">
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 text-xs font-bold rounded ${editor.isActive("heading", { level: 2 }) ? "bg-blue-600 text-white" : "bg-white border"}`}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-2 py-1 text-xs font-bold rounded ${editor.isActive("heading", { level: 3 }) ? "bg-blue-600 text-white" : "bg-white border"}`}>H3</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} className={`px-2 py-1 text-xs font-bold rounded ${editor.isActive("heading", { level: 4 }) ? "bg-blue-600 text-white" : "bg-white border"}`}>H4</button>

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

        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 text-xs font-bold rounded ${editor.isActive("bold") ? "bg-blue-600 text-white" : "bg-white border"}`}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive("italic") ? "bg-blue-600 text-white" : "bg-white border"}`}><i>I</i></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive("underline") ? "bg-blue-600 text-white" : "bg-white border"}`}><u>U</u></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive("strike") ? "bg-blue-600 text-white" : "bg-white border"}`}><s>S</s></button>

        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

        <select onChange={(e) => { setColor(e.target.value); e.target.value = ""; }} className="text-xs border rounded px-1 py-1 bg-white" value="">
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

        <select onChange={(e) => { editor.chain().focus().toggleHighlight({ color: e.target.value }).run(); e.target.value = ""; }} className="text-xs border rounded px-1 py-1 bg-white" value="">
          <option value="" disabled>背景色</option>
          <option value="#fef08a">■ 黄</option>
          <option value="#bbf7d0">■ 緑</option>
          <option value="#bfdbfe">■ 青</option>
          <option value="#fecaca">■ 赤</option>
          <option value="#e9d5ff">■ 紫</option>
          <option value="#fed7aa">■ 橙</option>
        </select>

        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive("bulletList") ? "bg-blue-600 text-white" : "bg-white border"}`}>・リスト</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`px-2 py-1 text-xs rounded ${editor.isActive("orderedList") ? "bg-blue-600 text-white" : "bg-white border"}`}>1.リスト</button>

        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

        <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={`px-2 py-1 text-xs rounded ${editor.isActive({ textAlign: "left" }) ? "bg-blue-600 text-white" : "bg-white border"}`}>左</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={`px-2 py-1 text-xs rounded ${editor.isActive({ textAlign: "center" }) ? "bg-blue-600 text-white" : "bg-white border"}`}>中</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={`px-2 py-1 text-xs rounded ${editor.isActive({ textAlign: "right" }) ? "bg-blue-600 text-white" : "bg-white border"}`}>右</button>
      </div>

      {/* ツールバー2段目 */}
      <div className="flex flex-wrap gap-1 p-2 bg-slate-100 border-b">
        <button type="button" onClick={addLink} className={`px-2 py-1 text-xs rounded ${editor.isActive("link") ? "bg-blue-600 text-white" : "bg-white border"}`}>🔗</button>
        {editor.isActive("link") && <button type="button" onClick={removeLink} className="px-2 py-1 text-xs rounded bg-red-100 text-red-600 border border-red-200">🔗✕</button>}
        <button type="button" onClick={addTelLink} className="px-2 py-1 text-xs rounded bg-green-600 text-white font-bold hover:bg-green-700">📞</button>

        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

        <button type="button" onClick={addImage} className="px-2 py-1 text-xs rounded bg-white border">🖼 画像</button>
        <button type="button" onClick={insertImageRow} className="px-2 py-1 text-xs rounded bg-white border">🖼🖼 横並び</button>
        <button type="button" onClick={changeImageSize} className="px-2 py-1 text-xs rounded bg-white border">📐 サイズ</button>
        <button type="button" onClick={changeImageCaption} className="px-2 py-1 text-xs rounded bg-white border">💬 キャプション</button>

        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

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

        <select onChange={(e) => { insertBox(e.target.value); e.target.value = ""; }} className="text-xs border rounded px-1 py-1 bg-white" value="">
          <option value="" disabled>📦 装飾</option>
          <option value="info">ℹ️ 情報（青）</option>
          <option value="warning">⚠️ 注意（黄）</option>
          <option value="success">✅ 成功（緑）</option>
          <option value="danger">🚨 警告（赤）</option>
          <option value="gray">📝 メモ（灰）</option>
        </select>

        <button type="button" onClick={insertBalloon} className="px-2 py-1 text-xs rounded bg-sky-500 text-white font-bold hover:bg-sky-600">💬 吹出</button>
        <button type="button" onClick={insertDetails} className="px-2 py-1 text-xs rounded bg-amber-500 text-white font-bold hover:bg-amber-600">▼ 折畳</button>
        <button type="button" onClick={removeDetails} className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 border border-amber-300 font-bold">▼ 解除</button>
        <button type="button" onClick={openCtaModal} className="px-2 py-1 text-xs rounded bg-red-600 text-white font-bold hover:bg-red-700">🔥 CTA</button>


        <span className="w-px h-6 bg-slate-300 mx-1 self-center" />

        <button type="button" onClick={() => { setShowOutline(!showOutline); updateHeadings(editor); }} className={`px-2 py-1 text-xs rounded font-bold ${showOutline ? "bg-indigo-600 text-white" : "bg-white border"}`}>📑 見出し</button>

        <button type="button" onClick={() => setHtmlMode(!htmlMode)} className={`px-2 py-1 text-xs rounded font-bold ml-auto ${htmlMode ? "bg-blue-600 text-white" : "bg-white border"}`}>
          {htmlMode ? "ビジュアル" : "HTML"}
        </button>
      </div>

      {/* 見出しアウトライン */}
      {showOutline && headings.length > 0 && (
        <div className="bg-indigo-50 border-b p-2 max-h-48 overflow-y-auto">
          <p className="text-[10px] font-bold text-indigo-400 mb-1">📑 見出しジャンプ</p>
          {headings.map((h, i) => (
            <button
              key={i}
              type="button"
              onClick={() => jumpToPos(h.pos + 1)}
              className="block w-full text-left text-xs py-1 px-2 hover:bg-indigo-100 rounded truncate text-indigo-800"
              style={{ paddingLeft: `${(h.level - 2) * 16 + 8}px` }}
            >
              <span className="font-bold text-indigo-400 mr-1">H{h.level}</span> {h.text}
            </button>
          ))}
        </div>
      )}

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
        .tiptap img { max-width: 100%; height: auto; border-radius: 8px; }
        .tiptap figure[data-resizable-image] { display: inline-block; }
        .tiptap figure[data-resizable-image] img { width: 100%; height: auto; border-radius: 8px; }
        .tiptap figure[data-resizable-image] figcaption { text-align: center; font-size: 0.85em; color: #6b7280; margin-top: 6px; }
        .tiptap div[data-image-row] { display: flex; gap: 16px; margin: 16px 0; flex-wrap: wrap; }
        .tiptap div[data-image-row] figure { flex: 1; min-width: 0; }
        .tiptap details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .tiptap details summary { font-weight: bold; cursor: pointer; color: #1e40af; font-size: 1.1em; }
        .tiptap [data-details-content] { margin-top: 8px; }
        .tiptap p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #adb5bd; pointer-events: none; float: left; height: 0; }
        .tiptap table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        .tiptap th { background: #f1f5f9; font-weight: bold; text-align: left; }
        .tiptap th, .tiptap td { border: 1px solid #cbd5e1; padding: 8px 12px; min-width: 80px; vertical-align: top; }
        .tiptap td p, .tiptap th p { margin: 0; }
        .tiptap div[data-box-type] { border-radius: 8px; padding: 16px; margin: 16px 0; }
        .tiptap div[data-box-type="info"] { background: #eff6ff; border: 1px solid #bfdbfe; }
        .tiptap div[data-box-type="warning"] { background: #fefce8; border: 1px solid #fde68a; }
        .tiptap div[data-box-type="success"] { background: #f0fdf4; border: 1px solid #bbf7d0; }
        .tiptap div[data-box-type="danger"] { background: #fef2f2; border: 1px solid #fecaca; }
        .tiptap div[data-box-type="gray"] { background: #f8fafc; border: 1px solid #e2e8f0; }
        .tiptap div[data-balloon] { display: flex; gap: 12px; margin: 16px 0; align-items: flex-start; }
        .tiptap div[data-balloon] img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
      `}</style>

      {/* CTAブロック選択モーダル */}
      {showCtaModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={() => setShowCtaModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg">🔥 CTAブロックを挿入</h2>
              <button onClick={() => setShowCtaModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <div className="p-4 space-y-4">
              {ctaBlocks.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <p className="mb-3">CTAブロックがまだありません</p>
                  <a href="/admin/cta-blocks" target="_blank" className="text-blue-600 underline font-bold">CTA管理画面で作成する →</a>
                </div>
              )}
              {ctaBlocks.map((block: any) => (
                <div key={block.id} className="border rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer" onClick={() => insertCtaHtml(block)}>
                  <div className="px-4 py-2 bg-slate-50 border-b flex justify-between items-center">
                    <span className="text-sm font-bold">{block.name}</span>
                    <span className="text-xs text-blue-600 font-bold">クリックで挿入 →</span>
                  </div>
                  <div style={{
                    ...(block.bgType === "gradient" && block.bgColor2
                      ? { background: `linear-gradient(135deg,${block.bgColor1},${block.bgColor2})` }
                      : { backgroundColor: block.bgColor1 }),
                    border: `1px solid ${block.borderColor}`,
                    borderRadius: `${block.borderRadius}px`,
                    padding: `${block.paddingY}px ${block.paddingX}px`,
                    textAlign: "center" as const,
                    margin: "12px",
                  }}>
                    {block.headingText && <div style={{ color: block.headingColor, fontSize: `${block.headingSize}px`, fontWeight: block.headingWeight, marginBottom: "8px" }}>{block.headingText}</div>}
                    {block.descText && <div style={{ color: block.descColor, fontSize: `${block.descSize}px`, fontWeight: block.descWeight, marginBottom: "12px", whiteSpace: "pre-line" as const, lineHeight: "1.6" }}>{block.descText}</div>}
                    {block.linkText && <div style={{ marginBottom: "12px" }}><span style={{ color: block.linkColor, fontSize: `${block.linkSize}px`, fontWeight: block.linkWeight, textDecoration: "underline" }}>{block.linkText}</span></div>}
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" as const }}>
                      {block.btnText && <span style={{ background: block.btnBgColor, color: block.btnTextColor, fontSize: `${block.btnSize}px`, fontWeight: block.btnWeight, padding: `${block.btnPaddingY}px ${block.btnPaddingX}px`, borderRadius: `${block.btnRadius}px`, display: "inline-block" }}>{block.btnText}</span>}
                      {block.btn2Text && <span style={{ background: block.btn2BgColor || "#e2e8f0", color: block.btn2TextColor || "#334155", fontSize: `${block.btn2Size}px`, fontWeight: block.btn2Weight, padding: `${block.btnPaddingY}px ${block.btnPaddingX}px`, borderRadius: `${block.btnRadius}px`, display: "inline-block" }}>{block.btn2Text}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

