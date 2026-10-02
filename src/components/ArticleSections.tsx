// @/src/components/ArticleSections.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { ArticleSection } from "@/lib/splitArticle";

/**
 * 本文を見出し(H3など)ごとに分割して表示する。
 * - 見出しは常に表示（構造が一目で分かる）
 * - 各セクションの本文は最初の約2行だけ表示 →「続きを読む」で展開
 * - 本文は常にDOMに存在（overflowで隠すだけ）→ SEOに影響なし
 */
export default function ArticleSections({
  preambleHtml,
  sections,
  className,
  previewHeight = 58,
}: {
  preambleHtml: string;
  sections: ArticleSection[];
  className?: string;
  previewHeight?: number;
}) {
  return (
    <div className="mb-16">
      {preambleHtml.trim() && (
        <div
          className={className}
          dangerouslySetInnerHTML={{ __html: preambleHtml }}
        />
      )}
      <div className="space-y-3 mt-4">
        {sections.map((sec) => (
          <SectionItem key={sec.id} sec={sec} className={className} previewHeight={previewHeight} />
        ))}
      </div>
    </div>
  );
}

function SectionItem({
  sec,
  className,
  previewHeight,
}: {
  sec: ArticleSection;
  className?: string;
  previewHeight: number;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [needsFold, setNeedsFold] = useState(false);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const check = () => setNeedsFold(el.scrollHeight > previewHeight + 24);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [sec.bodyHtml, previewHeight]);

  // 目次アンカーがこのセクションを指す場合は自動展開
  useEffect(() => {
    const check = () => {
      const hash = decodeURIComponent((window.location.hash || "").replace(/^#/, ""));
      if (hash && hash === sec.id) setExpanded(true);
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [sec.id]);

  const folded = needsFold && !expanded;

  return (
    <section className="border border-[#e7ecf1] rounded-2xl overflow-hidden bg-white shadow-[0_4px_14px_rgba(15,30,46,.04)]">
      <div className="px-5 pt-4">
        {/* 見出し（常時表示・idはアンカー用に保持） */}
        <div className={className} dangerouslySetInnerHTML={{ __html: sec.headingHtml }} />
      </div>
      <div className="px-5 pb-4">
        <div className="relative">
          <div
            ref={bodyRef}
            className={className}
            style={folded ? { maxHeight: previewHeight, overflow: "hidden" } : undefined}
            dangerouslySetInnerHTML={{ __html: sec.bodyHtml }}
          />
          {folded && (
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 h-10"
              style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1))" }}
              aria-hidden
            />
          )}
        </div>
        {needsFold && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#0e7ad1] hover:underline"
          >
            {expanded ? "閉じる" : "続きを読む"}
            <span aria-hidden className={`transition-transform ${expanded ? "rotate-180" : ""}`}>▾</span>
          </button>
        )}
      </div>
    </section>
  );
}
