// @/src/app/lp/house/page.tsx
import type { Metadata } from "next";
import LpTemplate from "@/components/lp/LpTemplate";
import { HOUSE_CONTENT } from "@/lib/lpContent";

export const metadata: Metadata = {
  title: "札幌のハウスクリーニング（在居中）｜お住まいのままお掃除",
  description:
    "札幌のハウスクリーニング。お住まいのまま、水回り・床・窓など気になる箇所をプロが清掃。必要な箇所だけでもOK。お見積り無料。",
  robots: { index: false, follow: true },
  alternates: { canonical: "/lp/house" },
};

export default function Page() {
  return <LpTemplate content={HOUSE_CONTENT} />;
}
