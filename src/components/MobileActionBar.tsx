// @/src/components/MobileActionBar.tsx
// サイト全ページ（LP含む）のスマホ用・画面下の固定バー。左から「📞 電話」「💬 LINE」「📅 予約」。PC（md以上）では出さない。
//  - 電話：PhoneLink（広告経由の人には転送番号 0800… に置き換わる）。18:00〜翌9:00は下に「時間外はLINE・予約へ」
//  - LINE：いちばん目立たせる（緑）。タップ計測（GA4 line_click ／ 自前記録 type:line）は
//          TrafficSourceCapture が全ページ共通で送る（line.me のリンクを押すと自動）
//  - 予約：ページ内のカレンダー予約（#booking）へ。カレンダーが無いページは「無料で相談」：
//          ページ内に申込フォーム（#lead）があればそこへ、無ければ /inquiry（LPと同じ形式の申込フォーム LeadForm のページ）へ
//          折りたたみの中にあるときは LpFoldAnchorOpener が開いてからスクロールする
// SiteShell から全ページに出す（LPのリッチ・ブロック・シンプル、トップ、サービス詳細、ブログなど）。
// 管理画面・サンクスページには出さない。
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import PhoneLink from "@/components/PhoneLink";
import AfterHoursNote from "@/components/lp/AfterHoursNote";

const LINE_URL = "https://line.me/ti/p/RBwKccvQ1O";

type Target = { href: string; label: string; booking: boolean } | null;

export default function MobileActionBar() {
  const pathname = usePathname();
  const [target, setTarget] = useState<Target>(null);

  // ページ内にカレンダー予約（#booking）があるか、無ければ申込欄（#lead）があるかを見て、3つ目のボタンを決める
  useEffect(() => {
    const pick = (): Target => {
      if (document.getElementById("booking")) return { href: "#booking", label: "予約", booking: true };
      if (document.getElementById("lead")) return { href: "#lead", label: "無料で相談", booking: false };
      return { href: "/inquiry", label: "無料で相談", booking: false };
    };
    setTarget(pick());
    // 本文の描画が遅れて出てくる場合に備えて、少し後にもう一度だけ確認
    const t = setTimeout(() => setTarget(pick()), 1500);
    return () => clearTimeout(t);
  }, [pathname]);

  // 管理画面・サンクスページには出さない
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/lp/thank-you") || pathname?.startsWith("/thank-you")) return null;

  const btn = "flex items-center justify-center gap-1 h-12 rounded-full font-black leading-none whitespace-nowrap";
  return (
    <>
      {/* 固定バーの高さぶん、ページの最後に余白（フッターが隠れないように） */}
      <div className="h-20 md:hidden" aria-hidden />
      <nav
        aria-label="お問い合わせ"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-4px_12px_rgba(15,30,46,0.08)] px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] grid grid-cols-[1fr_1.35fr_1fr] gap-2 items-start"
      >
        {/* 📞 電話（広告経由は転送番号） */}
        <div className="min-w-0">
          <PhoneLink className={`${btn} bg-white border-2 border-blue-600 text-blue-700 text-sm`} display="📞 電話" />
          <AfterHoursNote className="mt-1 text-[10px] leading-tight text-slate-500 text-center">時間外はLINE・予約へ</AfterHoursNote>
        </div>

        {/* 💬 LINE（いちばん目立たせる） */}
        <a
          href={LINE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} bg-[#06C755] text-white text-base shadow-md shadow-green-200 hover:brightness-105`}
        >
          💬 LINE
        </a>

        {/* 📅 予約（カレンダーへ）／カレンダーが無いLPは「無料で相談」 */}
        <a
          href={target?.href || "#lead"}
          className={`${btn} bg-red-600 text-white ${target && !target.booking ? "text-xs" : "text-sm"} hover:bg-red-700`}
        >
          {target && !target.booking ? target.label : "📅 予約"}
        </a>
      </nav>
    </>
  );
}
