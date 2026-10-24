// @/src/components/LineLink.tsx
// サイト共通の「LINEで相談」リンク（固定バー・LP・申込フォーム・カレンダーのQRなど）。
//  - スマホ：同じタブで LINE のURLを開く → LINEアプリに切り替わる
//    （以前は target="_blank"。新しいタブを開く形だと、iPhone/Android や Instagram・Googleアプリ内のブラウザで
//      アプリに切り替わらず「押しても何も起きない」ように見えることがあったため）
//  - PC（マウス操作）：新しいタブで開く（サイトから離れないように）
//  - 押した瞬間に少し縮んで暗くなる＋ openingText を指定すると数秒その文言に変わる（押せたことがわかるように）
//  - 計測（GA4 line_click ／ 自前記録 type:line）は TrafficSourceCapture が line.me のリンクのクリックで自動で送る
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BRAND } from "@/lib/lpContent";

export const LINE_URL = BRAND.lineUrl || "https://line.me/ti/p/RBwKccvQ1O";

export default function LineLink({
  href = LINE_URL,
  className = "",
  children,
  openingText,
  ariaLabel,
}: {
  href?: string;
  className?: string;
  children: ReactNode;
  /** 押した後、数秒だけ表示する文言（例：「LINEを開いています…」） */
  openingText?: ReactNode;
  ariaLabel?: string;
}) {
  const [opening, setOpening] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // LINEから戻ってきたら元の表示に戻す
    const reset = () => {
      if (document.visibilityState === "visible") setOpening(false);
    };
    document.addEventListener("visibilitychange", reset);
    window.addEventListener("pageshow", reset);
    return () => {
      document.removeEventListener("visibilitychange", reset);
      window.removeEventListener("pageshow", reset);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    setOpening(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpening(false), 4000);
    // PC（マウス操作）だけ新しいタブ。スマホは同じタブのまま（アプリに切り替わる）
    const isMouse = typeof window.matchMedia === "function" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (isMouse) {
      e.preventDefault();
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <a
      href={href}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`touch-manipulation select-none transition active:scale-[0.97] active:brightness-90 ${opening ? "brightness-90" : ""} ${className}`}
    >
      {opening && openingText ? openingText : children}
    </a>
  );
}
