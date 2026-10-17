// @/src/components/lp/AfterHoursNote.tsx
"use client";

import { useEffect, useState } from "react";

/**
 * 電話受付時間外（日本時間 18:00〜翌9:00）だけ表示する小さな注記。
 * サーバー描画時は何も出さず、ブラウザで時刻を見てから表示する（表示のずれ・ちらつき防止）。
 */
export default function AfterHoursNote({
  className,
  children = "時間外はLINE・予約が24時間受付",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => {
      const h = Number(
        new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", hour: "numeric", hourCycle: "h23" }).format(new Date())
      );
      setShow(h >= 18 || h < 9);
    };
    check();
    const id = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (!show) return null;
  return <p className={className}>{children}</p>;
}
