// @/src/app/lp/mizumawari/page.tsx
import type { Metadata } from "next";
import LpTemplate from "@/components/lp/LpTemplate";
import { getMizumawariContent } from "@/lib/lpContent";

export const metadata: Metadata = {
  title: "札幌の水回りクリーニング｜キッチン・浴室・トイレ",
  description:
    "札幌の水回りクリーニング。キッチン・浴室・レンジフード・洗面・トイレを単品でもセットでも。お見積り無料。",
  robots: { index: false, follow: true },
  alternates: { canonical: "/lp/mizumawari" },
};

export default function Page() {
  return <LpTemplate content={getMizumawariContent("set")} />;
}
