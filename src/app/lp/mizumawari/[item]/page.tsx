// @/src/app/lp/mizumawari/[item]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import LpTemplate from "@/components/lp/LpTemplate";
import LandingPageView from "@/components/lp/LandingPageView";
import {
  getMizumawariContent,
  MIZUMAWARI_ITEM_KEYS,
} from "@/lib/lpContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ item: string }>;
  searchParams: Promise<{ preview?: string }>;
};

const subMenusInclude = {
  subMenus: {
    include: { options: { orderBy: { order: "asc" as const } } },
    orderBy: { order: "asc" as const },
  },
  options: { orderBy: { order: "asc" as const } },
} as const;

async function getDbLp(item: string) {
  return prisma.landingPage.findUnique({
    where: { slug: `mizumawari-${item}` },
    include: {
      bookingMenus: { include: subMenusInclude },
      bookingCategories: { include: { menus: { include: subMenusInclude } } },
      beforeAfters: { orderBy: { createdAt: "desc" as const } },
      menuOptionRefs: true,
      menuSubMenuRefs: true,
      menuItemRefs: true,
      testimonialServicePages: { include: { testimonials: { where: { isActive: true }, orderBy: { order: "asc" as const } } } },
      faqServicePages: { include: { faqs: { orderBy: { order: "asc" as const } } } },
    },
  });
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { item } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "true";
  if (!(MIZUMAWARI_ITEM_KEYS as string[]).includes(item)) return {};

  const lp = await getDbLp(item);
  if (lp && (lp.status === "PUBLISHED" || isPreview)) {
    return {
      title: lp.title,
      description: lp.metaDescription || lp.catchphrase || "",
      robots: { index: false, follow: true },
      alternates: { canonical: lp.canonicalUrl || `/lp/mizumawari/${item}` },
    };
  }

  const c = getMizumawariContent(item);
  return {
    title: c.hero.title,
    description: c.hero.subtitle,
    robots: { index: false, follow: true },
    alternates: { canonical: `/lp/mizumawari/${item}` },
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { item } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "true";
  if (!(MIZUMAWARI_ITEM_KEYS as string[]).includes(item)) notFound();

  const lp = await getDbLp(item);

  // DB側が「公開済み」またはプレビュー時は、テンプレ設定（SIMPLE/RICH/BLOCKS/HTML）に従って描画。
  // それ以外（未作成・下書き）は従来どおりの静的コンテンツを表示する。
  if (lp && (lp.status === "PUBLISHED" || isPreview)) {
    return <LandingPageView lp={lp} isPreview={isPreview && lp.status !== "PUBLISHED"} />;
  }

  return <LpTemplate content={getMizumawariContent(item)} />;
}
