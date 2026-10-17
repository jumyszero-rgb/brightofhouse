// @/src/components/lp/LazyLpForms.tsx
"use client";

/**
 * LP用：カレンダー予約フォーム・お問い合わせフォームの「後読み」版。
 *
 * どちらもページ下部にあり、ファーストビューには不要なのに、JS（特にカレンダー予約は
 * date-fns ＋ 約90KBのコンポーネント）が最初の表示時に読み込まれ・実行されていた。
 * → 画面に近づいた時（下に約800pxの位置まで来た時）に初めて読み込む。
 *   #lead へのジャンプ（CTAボタン）でも、表示された瞬間に読み込みが始まる。
 * 読み込み中は同じくらいの高さの枠を出しておき、ガタつきを抑える。
 */
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import type ServicePageBookingComponent from "@/components/booking/ServicePageBooking";
import type LeadFormComponent from "@/components/lp/LeadForm";

function Placeholder({ minHeight }: { minHeight: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-400"
      style={{ minHeight }}
      aria-busy="true"
    >
      読み込み中…
    </div>
  );
}

const ServicePageBooking = dynamic(() => import("@/components/booking/ServicePageBooking"), {
  ssr: false,
  loading: () => <Placeholder minHeight={640} />,
});

const LeadForm = dynamic(() => import("@/components/lp/LeadForm"), {
  ssr: false,
  loading: () => <Placeholder minHeight={560} />,
});

/** 画面に近づいたら children を描画する（IntersectionObserver が無い環境ではすぐ描画） */
function WhenNearView({ minHeight, children }: { minHeight: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "800px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show]);

  return <div ref={ref}>{show ? children : <Placeholder minHeight={minHeight} />}</div>;
}

export function LazyServicePageBooking(props: ComponentProps<typeof ServicePageBookingComponent>) {
  return (
    <WhenNearView minHeight={640}>
      <ServicePageBooking {...props} />
    </WhenNearView>
  );
}

export function LazyLeadForm(props: ComponentProps<typeof LeadFormComponent>) {
  return (
    <WhenNearView minHeight={560}>
      <LeadForm {...props} />
    </WhenNearView>
  );
}
