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

export function landingPageToLpContent(lp: any): LpContent {
  const photos: LpPhoto[] = (lp.beforeAfters || []).map((ba: any) => ({
    before: ba.beforeUrl,
    after: ba.afterUrl,
    caption: ba.title,
  }));

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
      items: (lp.menuItems as LpMenuItem[] | null) || [],
      options: (lp.menuOptions as LpMenuItem[] | null) || undefined,
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
