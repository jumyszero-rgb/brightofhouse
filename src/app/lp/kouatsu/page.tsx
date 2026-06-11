// @/src/app/lp/kouatsu/page.tsx
import type { Metadata } from "next";
import LpTemplate from "@/components/lp/LpTemplate";
import { KOUATSU_CONTENT } from "@/lib/lpContent";

export const metadata: Metadata = {
  title: "札幌の排水管高圧洗浄｜流れが悪い・においの解消に",
  description:
    "札幌の排水管高圧洗浄。キッチン・浴室・洗面の排水詰まり・においを高圧洗浄ですっきり。戸建て・集合住宅対応。お見積り無料。",
  robots: { index: false, follow: true },
  alternates: { canonical: "/lp/kouatsu" },
};

export default function Page() {
  return <LpTemplate content={KOUATSU_CONTENT} />;
}
