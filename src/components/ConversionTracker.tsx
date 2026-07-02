"use client";

import { useEffect, useRef } from "react";

/**
 * サンキューページのマウント時に GA4 イベント `generate_lead` を発火する。
 * gtag が未ロードでも、用意できるまで待ってから確実に1回だけ発火する。
 */
export default function ConversionTracker({
  formType = "lead",
  value,
}: {
  formType?: string;
  value?: number;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || firedRef.current) return;

    const params: Record<string, any> = {
      form_type: formType,
      currency: "JPY",
    };
    if (typeof value === "number") params.value = value;

    const fire = (): boolean => {
      const w = window as any;
      if (typeof w.gtag !== "function") return false; // 窓口がまだなら待つ
      firedRef.current = true;
      w.gtag("event", "generate_lead", params);
      if (process.env.NODE_ENV !== "production") {
        console.log("[ConversionTracker] generate_lead 発火", params);
      }
      return true;
    };

    // 用意できていれば即発火。まだなら 0.1秒ごとに最大5秒待ってから発火。
    if (fire()) return;
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      if (fire() || tries >= 50) clearInterval(id);
    }, 100);

    return () => clearInterval(id);
  }, [formType, value]);

  return null;
}