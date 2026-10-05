// @/src/lib/lpStaticImport.ts
// コードに静的で埋め込まれている広告LP（lpContent.ts）を、
// 管理画面で編集できる DB(LandingPage) の RICH テンプレLPとして取り込むための変換。
// 取り込みは status="DRAFT" で作成するので、公開するまで現行の静的表示は一切変わらない。
import {
  getMizumawariContent,
  MIZUMAWARI_ITEM_KEYS,
  HOUSE_CONTENT,
  AKISHITSU_CONTENT,
  KOUATSU_CONTENT,
} from "@/lib/lpContent";
import type { LpContent } from "@/lib/lpContent";

export type ImportableLp = {
  key: string;      // 取り込みAPIに渡すキー
  slug: string;     // DB上のslug（公開ルートが参照する値）
  title: string;    // 管理画面での表示名
  url: string;      // 公開URL
  content: LpContent;
};

// 取り込み可能な静的LPの一覧（広告で使っている水回り個別5本＋セット＋house/akishitsu/kouatsu）。
export function getImportableLps(): ImportableLp[] {
  const items: ImportableLp[] = (MIZUMAWARI_ITEM_KEYS as string[]).map((item) => {
    const content = getMizumawariContent(item);
    return {
      key: `mizumawari-${item}`,
      slug: `mizumawari-${item}`,
      title: content.serviceLabel || `水回りクリーニング（${item}）`,
      url: `/lp/mizumawari/${item}`,
      content,
    };
  });

  const setContent = getMizumawariContent("set");
  const others: ImportableLp[] = [
    {
      key: "mizumawari-set",
      slug: "mizumawari-set",
      title: setContent.serviceLabel || "水回りクリーニング（セット）",
      url: "/lp/mizumawari",
      content: setContent,
    },
    {
      key: "house",
      slug: "house",
      title: HOUSE_CONTENT.serviceLabel || "ハウスクリーニング（在居中）",
      url: "/lp/house",
      content: HOUSE_CONTENT,
    },
    {
      key: "akishitsu",
      slug: "akishitsu",
      title: AKISHITSU_CONTENT.serviceLabel || "空室クリーニング",
      url: "/lp/akishitsu",
      content: AKISHITSU_CONTENT,
    },
    {
      key: "kouatsu",
      slug: "kouatsu",
      title: KOUATSU_CONTENT.serviceLabel || "排水管高圧洗浄",
      url: "/lp/kouatsu",
      content: KOUATSU_CONTENT,
    },
  ];

  return [...items, ...others];
}

// LpContent → LandingPage.create() に渡すデータ（RICHテンプレ・下書き）。
// landingPageToLpContent の逆変換。価格等は手入力(Json)として保存する（マスター連動はしない）。
export function lpContentToCreateData(content: LpContent, opts: { slug: string; title: string }) {
  const data: Record<string, any> = {
    slug: opts.slug,
    title: opts.title,
    status: "DRAFT",
    category: "CAMPAIGN",
    templateStyle: "RICH",
    noIndex: true,
    showBottomCta: true,
    catchphrase: content.hero.title || null,
    subCopy: content.hero.subtitle || null,
    heroEyebrow: content.hero.eyebrow || null,
    heroSubtitle: content.hero.subtitle || null,
    heroPriceLead: content.hero.priceLead || null,
    heroImage: content.hero.image || null,
    serviceLabel: content.serviceLabel || null,
    menuIntro: content.menu?.intro || null,
    campaignBadge: content.menu?.campaignBadge || null,
    setNote: content.menu?.setNote || null,
    // Json配列系（未指定は空配列/省略）
    pains: content.pains ?? [],
    menuItems: content.menu?.items ?? [],
    reasons: content.reasons ?? [],
    faqItems: content.faq ?? [],
  };

  // null を避けたい Json 任意項目は「値があるときだけ」入れる
  if (content.menu?.options && content.menu.options.length > 0) data.menuOptions = content.menu.options;
  if (content.menu?.baseWork && content.menu.baseWork.length > 0) data.baseWork = content.menu.baseWork;
  if (content.recommended && content.recommended.length > 0) data.recommended = content.recommended;
  if (content.voices && content.voices.length > 0) data.voices = content.voices;
  if (content.steps && content.steps.length > 0) data.steps = content.steps;

  // 施工写真 → BeforeAfter（多対多・ネスト作成）
  if (content.photos && content.photos.length > 0) {
    data.beforeAfters = {
      create: content.photos.map((p) => ({
        title: p.caption || "施工事例",
        beforeUrl: p.before,
        afterUrl: p.after,
      })),
    };
  }

  return data;
}
