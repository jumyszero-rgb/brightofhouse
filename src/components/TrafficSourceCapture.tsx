// @/src/components/TrafficSourceCapture.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureTrafficSource } from "@/lib/leadTracking";
import { trackLead, trackPageView } from "@/lib/attribution";

/**
 * 全ページ共通の計測補助（layout.tsx の body に1つ置くだけ・表示なし）。
 *  1) ランディング時に gclid / utm_* / 参照元 を sessionStorage へ保存（フォーム・予約の通知メールに載せる）
 *  2) 電話番号（tel: リンク）のタップ → GA4 `phone_tap`
 *     params: phone_number（実際にタップされた番号。広告経由で0800に置き換わっていれば0800）, page_path
 *  3) LINEリンク（line.me / lin.ee）のタップ → GA4 `line_click`
 *     params: link_url, page_path
 *  4) 2)・3) は GA4 とは別に、サイトのDB（LeadEvent）にも1件ずつ記録（管理画面 /admin/lead-events で即時に見られる）
 *  5) ページ表示（ページ移動のたび）を、ページ×日ごとの件数としてサイトのDB（PageViewDaily）に記録（人気のページの集計用）
 *
 * ヘッダー・下部固定ボタン・LP（HTMLブロック含む）・サービスページなど、どこに置かれたリンクでも拾えるよう
 * document 全体でクリックを監視する（各リンクを個別に書き換える必要がない）。
 * 発信アプリ起動・LINEアプリ起動でページを離れても落ちないよう transport_type: 'beacon' で送る。
 */
export default function TrafficSourceCapture() {
  const pathname = usePathname();

  useEffect(() => {
    captureTrafficSource();
  }, []);

  // ページ表示の記録（最初の表示と、サイト内のページ移動のたびに1回）
  useEffect(() => {
    if (!pathname) return;
    captureTrafficSource(); // 先に流入元を保存してから（広告経由の判定に使う）
    trackPageView(pathname);
  }, [pathname]);

  useEffect(() => {
    const send = (name: string, params: Record<string, unknown>) => {
      const w = window as unknown as { gtag?: (...args: unknown[]) => void };
      if (typeof w.gtag !== "function") return;
      w.gtag("event", name, { ...params, page_path: window.location.pathname, transport_type: "beacon" });
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const a = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") || "";

      if (/^tel:/i.test(href)) {
        const phone = href.replace(/^tel:/i, "").replace(/[^0-9+]/g, "");
        send("phone_tap", { phone_number: phone });
        trackLead("phone", { phoneNumber: phone });
        return;
      }
      if (/(^|\/\/|\.)line\.me\/|lin\.ee\//i.test(href)) {
        send("line_click", { link_url: href.slice(0, 200) });
        trackLead("line");
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
