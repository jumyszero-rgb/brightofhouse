// @/src/components/TrafficSourceCapture.tsx
"use client";

import { useEffect } from "react";
import { captureTrafficSource } from "@/lib/leadTracking";

/**
 * 全ページのランディング時に gclid / utm_* を sessionStorage へ保存する。
 * layout.tsx の body に1つ置くだけ（表示なし）。
 */
export default function TrafficSourceCapture() {
  useEffect(() => {
    captureTrafficSource();
  }, []);
  return null;
}
