"use client";

import { useEffect, useRef } from "react";
import { fireGenerateLead } from "@/lib/leadTracking";

/**
 * サンキューページのマウント時に GA4 イベント `generate_lead` を発火する。
 *
 * - gtag は layout.tsx の <head> で GA4 / Google広告ともに config 済み。
 *   そのため、ここで送るイベントは必ず GA4 にも届く（以前は GA4 の config 前に送っていて届いていなかった）。
 * - 送信パラメータ
 *   form_type        : "booking"（予約カレンダー）/ "lp"（LPフォーム）
 *   form_location    : どのページのフォームから送ったか（例: /lp/mizumawari/bathroom, /service/...）
 *                      props → URLの ?from= → 直前ページ（document.referrer）の順で決定
 *   service_category : form_location の lp/ または service/ の次の階層（例: mizumawari）
 * - サンキューページの再読み込み・戻る/進むでは再発火しない（フォームを送り直した場合は毎回計上）。
 */
const DEDUPE_KEY = "bh_cv_fired";
const DEDUPE_MS = 60 * 60 * 1000;

function sanitizePath(v: string | null | undefined): string {
  if (!v) return "";
  return v.replace(/[^A-Za-z0-9/_\-.]/g, "").slice(0, 100);
}

function referrerPath(): string {
  try {
    if (!document.referrer) return "";
    const u = new URL(document.referrer);
    if (u.origin !== window.location.origin) return "";
    return u.pathname;
  } catch {
    return "";
  }
}

function categoryFrom(location: string): string {
  const seg = location.replace(/^\/+/, "").split("/").filter(Boolean);
  const i = seg.findIndex((s) => s === "lp" || s === "service");
  return i >= 0 && seg[i + 1] ? seg[i + 1] : "";
}

export default function ConversionTracker({
  formType = "lead",
  value,
  formLocation,
  serviceCategory,
}: {
  formType?: string;
  value?: number;
  formLocation?: string;
  serviceCategory?: string;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || firedRef.current) return;
    firedRef.current = true;

    const fromQuery = new URLSearchParams(window.location.search).get("from");
    let location = sanitizePath(formLocation) || sanitizePath(fromQuery) || referrerPath();
    if (location && !location.startsWith("/")) location = `/${location}`;
    const category = sanitizePath(serviceCategory) || categoryFrom(location);

    // 再読み込み・戻る/進むでサンキューページを再表示した時だけ二重計上を防ぐ。
    // （フォームを送り直して遷移してきた場合は navigation type が "navigate" なので毎回計上する）
    const dedupeId = `${formType}|${location}`;
    try {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      const isRevisit = !!nav && (nav.type === "reload" || nav.type === "back_forward");
      const raw = sessionStorage.getItem(DEDUPE_KEY);
      const prev = raw ? (JSON.parse(raw) as { id: string; at: number }) : null;
      if (isRevisit && prev && prev.id === dedupeId && Date.now() - prev.at < DEDUPE_MS) return;
      sessionStorage.setItem(DEDUPE_KEY, JSON.stringify({ id: dedupeId, at: Date.now() }));
    } catch {
      /* sessionStorage不可の環境では重複防止なしで発火 */
    }

    const params: Record<string, unknown> = { form_type: formType };
    if (location) params.form_location = location;
    if (category) params.service_category = category;
    if (typeof value === "number") params.value = value;

    fireGenerateLead(params);
  }, [formType, value, formLocation, serviceCategory]);

  return null;
}
