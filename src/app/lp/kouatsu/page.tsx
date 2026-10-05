// @/src/app/lp/kouatsu/page.tsx
import type { Metadata } from "next";
import LpTemplate from "@/components/lp/LpTemplate";
import LandingPageView from "@/components/lp/LandingPageView";
import { KOUATSU_CONTENT } from "@/lib/lpContent";
import { getDbLpBySlug } from "@/lib/lpRoute";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DB_SLUG = "kouatsu";
const STATIC_TITLE = "札幌の排水管高圧洗浄｜流れが悪い・においの解消に";
const STATIC_DESC =
  "札幌の排水管高圧洗浄。キッチン・浴室・洗面の排水詰まり・においを高圧洗浄ですっきり。戸建て・集合住宅対応。お見積り無料。";

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
      alternates: { canonical: lp.canonicalUrl || "/lp/kouatsu" },
    };
  }
  return {
    title: STATIC_TITLE,
    description: STATIC_DESC,
    robots: { index: false, follow: true },
    alternates: { canonical: "/lp/kouatsu" },
  };
}

export default async function Page({ searchParams }: Props) {
  const { preview } = await searchParams;
  const isPreview = preview === "true";
  const lp = await getDbLpBySlug(DB_SLUG);

  if (lp && (lp.status === "PUBLISHED" || isPreview)) {
    return <LandingPageView lp={lp} isPreview={isPreview && lp.status !== "PUBLISHED"} />;
  }
  return <LpTemplate content={KOUATSU_CONTENT} />;
}
