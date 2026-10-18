// @/src/components/blog/CharCounter.tsx
// 本文の文字数表示（空白・改行を除く）。Tiptap エディタ内の表示と同じ数え方。
"use client";

import { useMemo } from "react";
import { countChars, formatNumber } from "@/lib/countChars";

export default function CharCounter({ html }: { html: string }) {
  const n = useMemo(() => countChars(html || ""), [html]);
  return (
    <p className="text-right text-xs text-slate-500">
      文字数 <span className="font-bold text-slate-900 text-sm">{formatNumber(n)}</span> 字
      <span className="ml-1 text-slate-400">（空白・改行を除く）</span>
    </p>
  );
}
