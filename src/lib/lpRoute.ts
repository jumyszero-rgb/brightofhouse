// @/src/lib/lpRoute.ts
// 固定URLのLPルート（house / akishitsu / kouatsu / mizumawari(set)）で共通して使う
// DB(LandingPage)取得ヘルパー。RICH/BLOCKS描画に必要な関連を全部includeする。
import prisma from "@/lib/prisma";
import { memo } from "@/lib/serverMemo";

const subMenusInclude = {
  subMenus: {
    include: { options: { orderBy: { order: "asc" as const } } },
    orderBy: { order: "asc" as const },
  },
  options: { orderBy: { order: "asc" as const } },
} as const;

export const lpRouteInclude = {
  bookingMenus: { include: subMenusInclude },
  bookingCategories: { include: { menus: { include: subMenusInclude } } },
  beforeAfters: { orderBy: { createdAt: "desc" as const } },
  menuOptionRefs: true,
  menuSubMenuRefs: true,
  menuItemRefs: true,
  testimonialServicePages: { include: { testimonials: { where: { isActive: true }, orderBy: { order: "asc" as const } } } },
  faqServicePages: { include: { faqs: { orderBy: { order: "asc" as const } } } },
} as const;

/** LPを取得（通常は作り置きから・プレビューは fresh: true で常に最新） */
export async function getDbLpBySlug(slug: string, opts?: { fresh?: boolean }) {
  return memo(
    `lp:slug:${slug}`,
    () =>
      prisma.landingPage.findUnique({
        where: { slug },
        include: lpRouteInclude,
      }),
    { fresh: opts?.fresh }
  );
}
