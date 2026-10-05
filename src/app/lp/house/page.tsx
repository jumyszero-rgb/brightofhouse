// @/src/app/lp/house/page.tsx
import type { Metadata } from "next";
import LpTemplate from "@/components/lp/LpTemplate";
import LandingPageView from "@/components/lp/LandingPageView";
import { HOUSE_CONTENT } from "@/lib/lpContent";
import { getDbLpBySlug } from "@/lib/lpRoute";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DB_SLUG = "house";
const STATIC_TITLE = "札幌のハウスクリーニング（在居中）｜お住まいのままお掃除";
const STATIC_DESC =
  "札幌のハウスクリーニング。お住まいのまま、水回り・床・窓など気になる箇所をプロが清掃。必要な箇所だけでもOK。お見積り無料。";

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
      alternates: { canonical: lp.canonicalUrl || "/lp/house" },
    };
  }
  return {
    title: STATIC_TITLE,
    description: STATIC_DESC,
    robots: { index: false, follow: true },
    alternates: { canonical: "/lp/house" },
  };
}

export default async function Page({ searchParams }: Props) {
  const { preview } = await searchParams;
  const isPreview = preview === "true";
  const lp = await getDbLpBySlug(DB_SLUG);

  if (lp && (lp.status === "PUBLISHED" || isPreview)) {
    return <LandingPageView lp={lp} isPreview={isPreview && lp.status !== "PUBLISHED"} />;
  }
  return <LpTemplate content={HOUSE_CONTENT} />;
}
