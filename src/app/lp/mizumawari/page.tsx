// @/src/app/lp/mizumawari/page.tsx
import type { Metadata } from "next";
import LpTemplate from "@/components/lp/LpTemplate";
import LandingPageView from "@/components/lp/LandingPageView";
import { getMizumawariContent } from "@/lib/lpContent";
import { getDbLpBySlug } from "@/lib/lpRoute";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DB_SLUG = "mizumawari-set";
const STATIC_TITLE = "札幌の水回りクリーニング｜キッチン・浴室・トイレ";
const STATIC_DESC =
  "札幌の水回りクリーニング。キッチン・浴室・レンジフード・洗面・トイレを単品でもセットでも。お見積り無料。";

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
      alternates: { canonical: lp.canonicalUrl || "/lp/mizumawari" },
    };
  }
  return {
    title: STATIC_TITLE,
    description: STATIC_DESC,
    robots: { index: false, follow: true },
    alternates: { canonical: "/lp/mizumawari" },
  };
}

export default async function Page({ searchParams }: Props) {
  const { preview } = await searchParams;
  const isPreview = preview === "true";
  const lp = await getDbLpBySlug(DB_SLUG);

  if (lp && (lp.status === "PUBLISHED" || isPreview)) {
    return <LandingPageView lp={lp} isPreview={isPreview && lp.status !== "PUBLISHED"} />;
  }
  return <LpTemplate content={getMizumawariContent("set")} />;
}
