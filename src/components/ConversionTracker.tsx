// @/src/components/ConversionTracker.tsx
"use client";

import { useEffect } from "react";

/**
 * サンキューページのマウント時に GA4 イベント `generate_lead` を発火する。
 * このイベントを GA4 で「キーイベント」に設定し、Google広告にインポートすると
 * フォーム送信がコンバージョンとして計測される（＝今まで抜けていたフォームCVを拾う）。
 *
 * - 発火はサンキューページ表示時に固定（リダイレクトを跨いでも確実に1回）
 * - formType でフォーム種別を区別（GA4パラメータとして送信）
 */
export default function ConversionTracker({
  formType = "lead",
  value,
}: {
  formType?: string;
  value?: number;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params: Record<string, any> = {
      form_type: formType,
      currency: "JPY",
    };
    if (typeof value === "number") params.value = value;

    const w = window as any;
    if (typeof w.gtag === "function") {
      w.gtag("event", "generate_lead", params);
    } else {
      // gtag 未ロード時のフォールバック
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push(["event", "generate_lead", params]);
    }
  }, [formType, value]);

  return null;
}
