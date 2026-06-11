// @/src/app/lp/akishitsu/page.tsx
import type { Metadata } from "next";
import LpTemplate from "@/components/lp/LpTemplate";
import { AKISHITSU_CONTENT } from "@/lib/lpContent";

export const metadata: Metadata = {
  title: "札幌の空室クリーニング｜退去後・入居前の原状回復",
  description:
    "札幌の空室クリーニング。退去後・引っ越し前後の空室を入居前のきれいな状態に。オーナー様・管理会社様のご依頼も対応。お見積り無料。",
  robots: { index: false, follow: true },
  alternates: { canonical: "/lp/akishitsu" },
};

export default function Page() {
  return <LpTemplate content={AKISHITSU_CONTENT} />;
}
