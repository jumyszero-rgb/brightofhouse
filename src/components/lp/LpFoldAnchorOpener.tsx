// @/src/components/lp/LpFoldAnchorOpener.tsx
// ブロックLP：折りたたみ（<details>）の中にあるフォームなどへ「#lead」「#booking」のボタンで飛んだとき、
// 閉じたままだと何も見えないので、飛び先を含む折りたたみを自動で開いてからスクロールする。
// （ページを開いた時点でURLに #… が付いている場合も同じ）
"use client";

import { useEffect } from "react";

function openAndScroll(hash: string, smooth: boolean): boolean {
  if (!hash || hash === "#") return false;
  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    /* そのまま */
  }
  const target = document.getElementById(id);
  if (!target) return false;
  let opened = false;
  let el: HTMLElement | null = target;
  while (el) {
    if (el.tagName === "DETAILS" && !(el as HTMLDetailsElement).open) {
      (el as HTMLDetailsElement).open = true;
      opened = true;
    }
    el = el.parentElement;
  }
  if (opened) {
    // 開いた直後はレイアウトが変わるので、次のフレームでスクロール
    requestAnimationFrame(() => target.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }));
  }
  return opened;
}

export default function LpFoldAnchorOpener() {
  useEffect(() => {
    if (window.location.hash) openAndScroll(window.location.hash, false);

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const hash = a.getAttribute("href") || "";
      if (openAndScroll(hash, true)) {
        e.preventDefault();
        history.replaceState(null, "", hash);
      }
    };
    const onHash = () => openAndScroll(window.location.hash, true);

    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHash);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);
  return null;
}
