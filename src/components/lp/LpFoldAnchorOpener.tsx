// @/src/components/lp/LpFoldAnchorOpener.tsx
// ページ内リンク（#booking・#lead など）で飛んだときの動き。SiteShell から全ページで動かす（LP以外も）。
//  - 飛び先が折りたたみ（<details>）の中、または折りたたみそのものなら、開いてからスクロールする
//    （カレンダー予約ブロック・申込フォームブロックを「最初は閉じる」にしていても、ボタンで飛べば開く）
//  - 固定ヘッダーに隠れないよう、ヘッダーの高さ＋少しの余白をとって止める
//  - 開くとフォームの部品を読み込む（dynamic）ので高さが変わる → 読み込みが終わって高さが落ち着くまで、位置を合わせ直す
//    （その間にお客様が自分でスクロールしたら、合わせ直しはやめる）
//  - 動くきっかけ：リンクのクリック（同じリンクを何度押しても動く）／hashchange／URLに #… 付きで開いたとき
//  - 対象：固定バーの「予約」、メニューブロックのボタン、本文HTMLに手で書いた <a href="#booking"> なども全部
//  - 飛び先は id のほか、data-anchor（例：申込フォームが無いLPでは、カレンダーが data-anchor="lead" も兼ねる）でも探す
"use client";

import { useEffect } from "react";

const GAP = 12; // ヘッダーの下に空ける余白(px)

function findTarget(id: string): HTMLElement | null {
  if (!id) return null;
  const byId = document.getElementById(id);
  if (byId) return byId;
  try {
    return document.querySelector<HTMLElement>(`[data-anchor~="${CSS.escape(id)}"]`);
  } catch {
    return null;
  }
}

function headerOffset(): number {
  // 固定・追従ヘッダー（LP：LpHeader、それ以外：Header）。data-fixed-header の目印で高さを測る
  const h = document.querySelector<HTMLElement>("[data-fixed-header]");
  return (h ? h.getBoundingClientRect().height : 0) + GAP;
}

/** 飛び先と、その外側の折りたたみを全部開く */
function openAll(target: HTMLElement) {
  let el: HTMLElement | null = target;
  while (el) {
    if (el.tagName === "DETAILS" && !(el as HTMLDetailsElement).open) (el as HTMLDetailsElement).open = true;
    el = el.parentElement;
  }
}

let cancelAlign: (() => void) | null = null;

function scrollToTarget(target: HTMLElement, smooth: boolean) {
  cancelAlign?.();
  const go = (behavior: ScrollBehavior) => {
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset();
    window.scrollTo({ top: Math.max(0, top), behavior });
  };
  // 開いた直後はレイアウトが変わるので、次のフレームで最初のスクロール
  requestAnimationFrame(() => go(smooth ? "smooth" : "auto"));

  // 部品の読み込みで高さが変わる間（最大4秒）は位置を合わせ直す。お客様が操作したらやめる
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    ro?.disconnect();
    clearTimeout(timer);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("wheel", stop);
    window.removeEventListener("keydown", stop);
    if (cancelAlign === stop) cancelAlign = null;
  };
  let pending = 0;
  const realign = () => {
    if (stopped) return;
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      const diff = target.getBoundingClientRect().top - headerOffset();
      if (Math.abs(diff) > 4) go("auto");
    });
  };
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(realign) : null;
  ro?.observe(document.body);
  ro?.observe(target);
  const timer = setTimeout(stop, 4000);
  // スムーズスクロール中に止めないよう、操作の検知は少し後から
  setTimeout(() => {
    if (stopped) return;
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("keydown", stop);
  }, 700);
  cancelAlign = stop;
}

function handleHash(hash: string, smooth: boolean): boolean {
  if (!hash || hash === "#") return false;
  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    /* そのまま */
  }
  const target = findTarget(id);
  if (!target) return false;
  openAll(target);
  scrollToTarget(target, smooth);
  return true;
}

export default function LpFoldAnchorOpener() {
  useEffect(() => {
    // URLに #… 付きで開いたとき（ブラウザの自動スクロールの後で、開いて合わせ直す）
    if (window.location.hash) {
      const h = window.location.hash;
      setTimeout(() => handleHash(h, false), 50);
    }

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self")) return;
      const raw = a.getAttribute("href") || "";
      let hash = "";
      if (raw.startsWith("#")) hash = raw;
      else {
        // 「/lp/house-all#booking」のように同じページを指すリンクも対象
        try {
          const u = new URL(raw, window.location.href);
          if (u.origin === window.location.origin && u.pathname === window.location.pathname && u.hash) hash = u.hash;
        } catch {
          return;
        }
      }
      if (!hash) return;
      if (handleHash(hash, true)) {
        e.preventDefault();
        // URLの # も更新（hashchange は起こさない＝二重に動かない。同じボタンを何度押しても動く）
        if (window.location.hash !== hash) history.replaceState(history.state, "", hash);
      }
    };
    const onHash = () => handleHash(window.location.hash, true);

    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHash);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHash);
      cancelAlign?.();
    };
  }, []);
  return null;
}
