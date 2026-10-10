// @/src/components/PhoneLink.tsx
"use client";

import { useEffect, useState } from "react";

/**
 * 電話番号の共通コンポーネント。
 * Google広告の「ウェブサイト通話コンバージョン」は、広告から来た人に対して
 * ページ内の番号を 0800 番号へ置き換えて計測する。置き換えはページ読み込み時の
 * 番号にしか効かないため、React で描画される番号は _googWcmGet で明示的に反映する。
 *
 * - 表示テキストと tel: の両方を置換後番号に合わせる
 * - 広告以外からの流入では元の 0120-792-684 のまま
 * - gtag.js の読み込み完了を待つため、_googWcmGet が用意されるまで最大10秒待つ
 *
 * 使い方：
 *   <PhoneLink className="..." />                          → 0120-792-684（リンク＋表示）
 *   <PhoneLink className="..." prefix="📞 " />              → 「📞 0120-792-684」
 *   <PhoneLink className="..." numberClassName="..." />     → 番号部分だけ <span> で装飾
 *   <PhoneLink className="..." display="お電話はこちら" />  → 表示は固定文言、tel:だけ置換
 */
const DEFAULT_NUMBER = "0120-792-684";

type WcmWindow = {
  _googWcmGet?: (cb: (formatted: string, mobile: string) => void, dflt: string) => void;
};

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

  useEffect(() => {
    let cancelled = false;
    const apply = (): boolean => {
      const w = window as unknown as WcmWindow;
      if (typeof w._googWcmGet !== "function") return false;
      try {
        w._googWcmGet((formatted, mobile) => {
          if (cancelled) return;
          if (formatted) setNum(formatted);
          if (mobile) setTel(mobile);
          else if (formatted) setTel(formatted);
        }, DEFAULT_NUMBER);
      } catch {
        /* 置換に失敗しても既定番号のまま表示 */
      }
      return true;
    };
    if (apply()) return () => { cancelled = true; };
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      if (apply() || tries >= 50) clearInterval(id);
    }, 200);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const telHref = `tel:${tel.replace(/[^0-9+]/g, "")}`;
  const shown = display ?? num;
  return (
    <a href={telHref} className={className}>
      {prefix}
      {numberClassName ? <span className={numberClassName}>{shown}</span> : shown}
      {suffix}
    </a>
  );
}
