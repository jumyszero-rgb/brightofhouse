// @/src/app/lp/[slug]/page.tsx
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import LandingPageView from "@/components/lp/LandingPageView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

const subMenusInclude = {
  subMenus: {
    include: { options: { orderBy: { order: "asc" as const } } },
    orderBy: { order: "asc" as const },
  },
  options: { orderBy: { order: "asc" as const } },
} as const;

const lpInclude = {
  bookingMenus: { include: subMenusInclude },
  bookingCategories: { include: { menus: { include: subMenusInclude } } },
  beforeAfters: { orderBy: { createdAt: "desc" as const } },
  menuOptionRefs: true,
  menuSubMenuRefs: true,
  menuItemRefs: true,
  testimonialServicePages: { include: { testimonials: { where: { isActive: true }, orderBy: { order: "asc" as const } } } },
  faqServicePages: { include: { faqs: { orderBy: { order: "asc" as const } } } },
} as const;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "true";
  const lp = await prisma.landingPage.findUnique({
    where: { slug, category: "CAMPAIGN" }
  });

  if (!lp || (lp.status === "DRAFT" && !isPreview)) return { title: "ページが見つかりません" };

  return {
    title: lp.title,
    description: lp.metaDescription || lp.catchphrase || "北海道ブライトオブハウスのお得なキャンペーン情報です。",
    ...(lp.noIndex && { robots: { index: false, follow: true } }),
    alternates: { canonical: lp.canonicalUrl || `/lp/${lp.slug}` },
    openGraph: {
      title: lp.title,
      description: lp.metaDescription || lp.catchphrase || "",
      images: lp.heroImage ? [lp.heroImage] : [],
      url: `https://brightofhouse.jp/lp/${lp.slug}`,
    },
  };
}

export default async function LPPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "true";

  const lp = await prisma.landingPage.findUnique({
    where: { slug, category: "CAMPAIGN" },
    include: lpInclude,
  });

  if (!lp || (lp.status === "DRAFT" && !isPreview)) notFound();

  return <LandingPageView lp={lp} isPreview={isPreview} />;
}
