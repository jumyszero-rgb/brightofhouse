// @/src/app/lp/mizumawari/[item]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import LpTemplate from "@/components/lp/LpTemplate";
import {
  getMizumawariContent,
  MIZUMAWARI_ITEM_KEYS,
} from "@/lib/lpContent";
import { landingPageToLpContent } from "@/lib/lpRichContent";
import { bookingSelectionToBookingData } from "@/lib/bookingMenuToBookingData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ item: string }> };

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
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { item } = await params;
  if (!(MIZUMAWARI_ITEM_KEYS as string[]).includes(item)) return {};

  const lp = await getDbLp(item);
  if (lp && lp.status === "PUBLISHED") {
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

export default async function Page({ params }: Props) {
  const { item } = await params;
  if (!(MIZUMAWARI_ITEM_KEYS as string[]).includes(item)) notFound();

  const lp = await getDbLp(item);

  // 管理画面(DB)側を公開済みにするまでは、従来の静的コンテンツをそのまま表示する
  if (!lp || lp.status !== "PUBLISHED") {
    return <LpTemplate content={getMizumawariContent(item)} />;
  }

  const effectiveBookingData =
    lp.bookingMenus.length > 0 || lp.bookingCategories.length > 0
      ? bookingSelectionToBookingData(lp.bookingCategories, lp.bookingMenus)
      : (lp.bookingData as any);

  return <LpTemplate content={landingPageToLpContent(lp)} bookingData={effectiveBookingData} />;
}
