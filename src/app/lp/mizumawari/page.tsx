// @/src/app/lp/mizumawari/page.tsx
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import LpTemplate from "@/components/lp/LpTemplate";
import { getMizumawariContent } from "@/lib/lpContent";
import { landingPageToLpContent } from "@/lib/lpRichContent";
import { bookingSelectionToBookingData } from "@/lib/bookingMenuToBookingData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DB_SLUG = "mizumawari-set";

const subMenusInclude = {
  subMenus: {
    include: { options: { orderBy: { order: "asc" as const } } },
    orderBy: { order: "asc" as const },
  },
  options: { orderBy: { order: "asc" as const } },
} as const;

async function getDbLp() {
  return prisma.landingPage.findUnique({
    where: { slug: DB_SLUG },
    include: {
      bookingMenus: { include: subMenusInclude },
      bookingCategories: { include: { menus: { include: subMenusInclude } } },
      beforeAfters: { orderBy: { createdAt: "desc" as const } },
      menuOptionRefs: true,
      menuSubMenuRefs: true,
      menuItemRefs: true,
      testimonialServicePages: { include: { testimonials: { where: { isActive: true }, orderBy: { order: "asc" as const } } } },
    },
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const lp = await getDbLp();
  if (lp && lp.status === "PUBLISHED") {
    return {
      title: lp.title,
      description: lp.metaDescription || lp.catchphrase || "北海道ブライトオブハウスのお得な水回りクリーニング情報です。",
      ...(lp.noIndex !== false ? { robots: { index: false, follow: true } } : {}),
      alternates: { canonical: lp.canonicalUrl || "/lp/mizumawari" },
    };
  }
  return {
    title: "札幌の水回りクリーニング｜キッチン・浴室・トイレ",
    description:
      "札幌の水回りクリーニング。キッチン・浴室・レンジフード・洗面・トイレを単品でもセットでも。お見積り無料。",
    robots: { index: false, follow: true },
    alternates: { canonical: "/lp/mizumawari" },
  };
}

export default async function Page() {
  const lp = await getDbLp();

  // 管理画面(DB)側を公開済みにするまでは、従来の静的コンテンツをそのまま表示する
  if (!lp || lp.status !== "PUBLISHED") {
    return <LpTemplate content={getMizumawariContent("set")} />;
  }

  const effectiveBookingData =
    lp.bookingMenus.length > 0 || lp.bookingCategories.length > 0
      ? bookingSelectionToBookingData(lp.bookingCategories, lp.bookingMenus)
      : (lp.bookingData as any);

  return <LpTemplate content={landingPageToLpContent(lp)} bookingData={effectiveBookingData} />;
}
