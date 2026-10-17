// @/src/components/PhoneLink.tsx
"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 電話番号の共通コンポーネント。
 * Google広告の「ウェブサイト通話コンバージョン」は、広告から来た人に対して
 * ページ内の「0120-792-684」という文字を 0800 番号へ置き換え、その文字を含む
 * リンクの tel: も一緒に書き換えて計測する。
 *
 * 【2026-10-18 修正】
 *  これまでは window._googWcmGet で置き換え後の番号を受け取る作りだったが、
 *  今のGoogleタグでは _googWcmGet が用意されず、番号の文字が無いボタン
 *  （固定バーの「📞 電話する」など display 指定のもの）は 0120 のまま残っていた。
 *  → display 指定時も、見えない番号（読み上げ用 sr-only）を必ずリンク内に置く。
 *    Googleがその文字を見つけて、リンクの tel: ごと 0800 に置き換える（本番で動作確認済み）。
 *  → 置き換わったら MutationObserver で番号を受け取り、React 側の状態にも反映する
 *    （再描画で 0120 に戻らないように）。同じページの他の PhoneLink にも共有する。
 *
 * 使い方：
 *   <PhoneLink className="..." />                          → 0120-792-684（リンク＋表示）
 *   <PhoneLink className="..." prefix="📞 " />              → 「📞 0120-792-684」
 *   <PhoneLink className="..." numberClassName="..." />     → 番号部分だけ <span> で装飾
 *   <PhoneLink className="..." display="お電話はこちら" />  → 表示は固定文言、tel:だけ置換
 */
const DEFAULT_NUMBER = "0120-792-684";
const DEFAULT_DIGITS = DEFAULT_NUMBER.replace(/[^0-9]/g, "");
const EVENT = "bh:phone-number";

type WcmWindow = {
  _googWcmGet?: (cb: (formatted: string, mobile: string) => void, dflt: string) => void;
  __bhPhone?: { formatted: string; mobile: string };
};

const digits = (s: string) => s.replace(/[^0-9+]/g, "");

/** 置き換え後の番号をページ全体で共有する */
function share(formatted: string, mobile: string) {
  const w = window as unknown as WcmWindow;
  if (!formatted || digits(formatted) === DEFAULT_DIGITS) return;
  if (w.__bhPhone?.formatted === formatted) return;
  w.__bhPhone = { formatted, mobile: mobile || formatted };
  window.dispatchEvent(new CustomEvent(EVENT));
}

export default function PhoneLink({
  className,
  numberClassName,
  prefix,
  suffix,
  display,
}: {
  className?: string;
  /** 番号部分だけに付けるクラス（指定時は番号を <span> で包む） */
  numberClassName?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  /** 表示文言を固定したい場合（例：「お電話で相談」）。省略時は番号を表示（置換対象）。 */
  display?: React.ReactNode;
}) {
  const [num, setNum] = useState(DEFAULT_NUMBER); // 表示用
  const [tel, setTel] = useState(DEFAULT_NUMBER); // tel: 用
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const w = window as unknown as WcmWindow;
    let cancelled = false;

    const applyShared = () => {
      const p = w.__bhPhone;
      if (!p || cancelled) return;
      setNum(p.formatted);
      setTel(p.mobile || p.formatted);
    };
    applyShared();
    window.addEventListener(EVENT, applyShared);

    // ① Google がリンク内の番号（文字・tel:）を書き換えたら拾う
    const el = ref.current;
    let mo: MutationObserver | null = null;
    if (el && typeof MutationObserver !== "undefined") {
      mo = new MutationObserver(() => {
        const href = el.getAttribute("href") || "";
        const hrefDigits = digits(href.replace(/^tel:/i, ""));
        const text = el.querySelector("[data-phone]")?.textContent?.trim() || "";
        if (hrefDigits && hrefDigits !== DEFAULT_DIGITS) {
          share(text && digits(text) !== DEFAULT_DIGITS ? text : hrefDigits, hrefDigits);
        } else if (text && digits(text) !== DEFAULT_DIGITS) {
          share(text, digits(text));
        }
      });
      mo.observe(el, { attributes: true, attributeFilter: ["href"], childList: true, characterData: true, subtree: true });
    }

    // ② 旧方式（_googWcmGet が用意されている環境向けの保険）。最大30秒待つ
    const tryWcm = (): boolean => {
      if (typeof w._googWcmGet !== "function") return false;
      try {
        w._googWcmGet((formatted, mobile) => {
          if (!cancelled) share(formatted, mobile);
        }, DEFAULT_NUMBER);
      } catch {
        /* 置換に失敗しても既定番号のまま */
      }
      return true;
    };
    let id: ReturnType<typeof setInterval> | undefined;
    if (!tryWcm()) {
      let tries = 0;
      id = setInterval(() => {
        tries += 1;
        if (tryWcm() || w.__bhPhone || tries >= 60) clearInterval(id);
      }, 500);
    }

    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, applyShared);
      mo?.disconnect();
      if (id) clearInterval(id);
    };
  }, []);

  const telHref = `tel:${digits(tel)}`;
  return (
    <a ref={ref} href={telHref} className={className}>
      {prefix}
      {display != null ? (
        <>
          {display}
          {/* Googleの番号置き換え用（画面には出さない・読み上げでは番号として読まれる） */}
          <span data-phone className="sr-only">{num}</span>
        </>
      ) : numberClassName ? (
        <span data-phone className={numberClassName}>{num}</span>
      ) : (
        <span data-phone>{num}</span>
      )}
      {suffix}
    </a>
  );
}
