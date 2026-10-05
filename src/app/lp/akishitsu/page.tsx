// @/src/app/lp/akishitsu/page.tsx
import type { Metadata } from "next";
import LpTemplate from "@/components/lp/LpTemplate";
import LandingPageView from "@/components/lp/LandingPageView";
import { AKISHITSU_CONTENT } from "@/lib/lpContent";
import { getDbLpBySlug } from "@/lib/lpRoute";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DB_SLUG = "akishitsu";
const STATIC_TITLE = "札幌の空室クリーニング｜退去後・入居前の原状回復";
const STATIC_DESC =
  "札幌の空室クリーニング。退去後・引っ越し前後の空室を入居前のきれいな状態に。オーナー様・管理会社様のご依頼も対応。お見積り無料。";

type Props = { searchParams: Promise<{ preview?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { preview } = await searchParams;
  const isPreview = preview === "true";
  const lp = await getDbLpBySlug(DB_SLUG);
  if (lp && (lp.status === "PUBLISHED" || isPreview)) {
    return {
      title: lp.title,
      description: lp.metaDescription || lp.catchphrase || STATIC_DESC,
      robots: { index: false, follow: true },
      alternates: { canonical: lp.canonicalUrl || "/lp/akishitsu" },
    };
  }
  return {
    title: STATIC_TITLE,
    description: STATIC_DESC,
    robots: { index: false, follow: true },
    alternates: { canonical: "/lp/akishitsu" },
  };
}

export default async function Page({ searchParams }: Props) {
  const { preview } = await searchParams;
  const isPreview = preview === "true";
  const lp = await getDbLpBySlug(DB_SLUG);

  if (lp && (lp.status === "PUBLISHED" || isPreview)) {
    return <LandingPageView lp={lp} isPreview={isPreview && lp.status !== "PUBLISHED"} />;
  }
  return <LpTemplate content={AKISHITSU_CONTENT} />;
}
