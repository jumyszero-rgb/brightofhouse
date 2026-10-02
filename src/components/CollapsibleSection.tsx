// @/src/components/CollapsibleSection.tsx
"use client";

import { useState } from "react";

/**
 * 見出しクリックで開閉する折りたたみセクション（アコーディオン）。
 * - 中身は常にDOMに存在（display切替のみ）→ SEO/クロールに影響なし
 * - 施工事例・お客様の声・FAQ など、長くなりがちなブロックを畳むのに使用
 */
export default function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  accent = "#0e7ad1",
  count,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accent?: string;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 bg-white border border-[#e7ecf1] rounded-2xl px-5 py-4 shadow-[0_4px_14px_rgba(15,30,46,.05)] hover:bg-[#f4f8fb] transition-colors"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ background: accent }} />
          <span className="text-lg md:text-xl font-black text-slate-800 truncate">{title}</span>
          {typeof count === "number" && count > 0 && (
            <span className="text-xs font-bold text-slate-400 flex-shrink-0">（{count}件）</span>
          )}
        </span>
        <span
          className={`flex-shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {/* SEOのため display 切替（DOMには常に存在） */}
      <div className={open ? "pt-6" : "hidden"}>{children}</div>
    </section>
  );
}
