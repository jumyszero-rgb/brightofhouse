// @/src/lib/lpRichContent.ts
// 管理画面(LandingPage)のリッチLP用フィールドを、静的LP(lpContent.ts)と同じ
// LpContent形式に変換する。DB由来のLPをLpTemplateでそのまま描画できるようにするための橋渡し。
import type {
  LpContent,
  LpFaq,
  LpMenuItem,
  LpPhoto,
  LpReason,
  LpRecommend,
  LpStep,
  LpVoice,
  LpWorkItem,
} from "@/lib/lpContent";
import { resolvePrice } from "@/lib/bookingMenuToBookingData";

export function landingPageToLpContent(lp: any): LpContent {
  const photos: LpPhoto[] = (lp.beforeAfters || []).map((ba: any) => ({
    before: ba.beforeUrl,
    after: ba.afterUrl,
    caption: ba.title,
  }));

  // 予約マスターのオプション(BookingOption)・小分類(BookingSubMenu)と連動させた項目。
  // 価格・名称は保存せず常に最新のマスターから解決する。
  const linkedOptions: LpMenuItem[] = (lp.menuOptionRefs || []).map((o: any) => {
    const { price, originalPrice } = resolvePrice(o.price, null, o.discountPercent, o.discountRounding);
    return {
      name: o.title,
      price: `¥${price.toLocaleString()}`,
      note: o.workContent || o.recommendPoint || undefined,
      compare: originalPrice != null ? `¥${originalPrice.toLocaleString()}` : undefined,
    };
  });
  const linkedSubMenus: LpMenuItem[] = (lp.menuSubMenuRefs || []).map((sm: any) => {
    const { price, originalPrice } = resolvePrice(sm.price, sm.webSpecialPrice, sm.discountPercent, sm.discountRounding);
    return {
      name: sm.title,
      price: `¥${price.toLocaleString()}`,
      note: sm.workContent || sm.recommendPoint || undefined,
      compare: originalPrice != null ? `¥${originalPrice.toLocaleString()}` : undefined,
    };
  });
  const manualOptions = (lp.menuOptions as LpMenuItem[] | null) || [];
  const options = [...linkedOptions, ...linkedSubMenus, ...manualOptions];

  // 料金表(menu.items)を予約マスターの中分類(BookingMenu)と連動させた項目。
  // 名称・価格・作業内容・注意事項は保存せず常に最新のマスターから解決する。
  const linkedMenuItems: LpMenuItem[] = (lp.menuItemRefs || []).map((m: any) => {
    const { price, originalPrice } = resolvePrice(m.basePrice, m.webSpecialPrice, m.discountPercent, m.discountRounding);
    return {
      name: m.title,
      price: `¥${price.toLocaleString()}`,
      note: m.recommendPoint || undefined,
      compare: originalPrice != null ? `¥${originalPrice.toLocaleString()}` : undefined,
      workContent: m.workContent || undefined,
      cautionNote: m.cautionNote || undefined,
    };
  });
  const manualMenuItems = (lp.menuItems as LpMenuItem[] | null) || [];
  const menuItems = [...linkedMenuItems, ...manualMenuItems];

  return {
    slug: lp.slug,
    serviceLabel: lp.serviceLabel || lp.title,
    hero: {
      eyebrow: lp.heroEyebrow || "",
      title: lp.catchphrase || lp.title,
      subtitle: lp.heroSubtitle || lp.subCopy || "",
      priceLead: lp.heroPriceLead || undefined,
      image: lp.heroImage || undefined,
    },
    pains: (lp.pains as string[] | null) || [],
    menu: {
      intro: lp.menuIntro || undefined,
      campaignBadge: lp.campaignBadge || undefined,
      items: menuItems,
      options: options.length > 0 ? options : undefined,
      baseWork: (lp.baseWork as LpWorkItem[] | null) || undefined,
      setNote: lp.setNote || undefined,
    },
    reasons: (lp.reasons as LpReason[] | null) || [],
    faq: (lp.faqItems as LpFaq[] | null) || [],
    voices: (lp.voices as LpVoice[] | null) || undefined,
    photos: photos.length > 0 ? photos : undefined,
    recommended: (lp.recommended as LpRecommend[] | null) || undefined,
    steps: (lp.steps as LpStep[] | null) || undefined,
  };
}
