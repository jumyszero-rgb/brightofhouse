// @/src/lib/bookingMenuToBookingData.ts
// BookingMenu(予約マスター)にリンクされたページ用に、ServicePageBooking が読める
// BookingData 相当の構造を生成する。マスターの価格変更が即座に全ページへ反映されるよう、
// bookingData を保存せずレンダリング時に都度この関数で変換する。
// 1ページに複数のBookingMenuをリンクできるため、各メニューを1つの main として並べる。

export type RoundingMode = "NONE" | "UP" | "DOWN";

// ServicePage.displayMenuIds にこの値だけが入っている場合、「本文には何も表示しない」を意味する。
// 空配列([])は「未設定＝連動している全項目を表示」という意味で使われているため、
// ユーザーが全項目のチェックを外した状態と区別するために専用の値を使う。
export const HIDE_ALL_DISPLAY_MENUS = "__HIDE_ALL__";

type SetDiscountRules = {
  enabled: boolean;
  type: "amount" | "percent";
  rules: { count: number; value: number }[];
  rounding?: RoundingMode;
} | null;

type BookingOptionForMenu = {
  id: string;
  title: string;
  price: number;
  durationMin: number;
  durationMax: number | null;
  workContent: string | null;
  recommendPoint: string | null;
  maxQty: number | null;
  discountPercent: number | null;
  discountRounding: string;
  qtyDiscountRules: unknown;
};

type BookingSubMenuForMenu = {
  id: string;
  title: string;
  price: number;
  durationMin: number;
  durationMax: number | null;
  workContent: string | null;
  recommendPoint: string | null;
  cautionNote: string | null;
  discountPercent: number | null;
  discountRounding: string;
  webSpecialPrice: number | null;
  options: BookingOptionForMenu[];
};

type BookingMenuForConvert = {
  id: string;
  title: string;
  basePrice: number;
  durationMin: number;
  durationMax: number | null;
  workContent: string | null;
  recommendPoint: string | null;
  cautionNote: string | null;
  setDiscountRules: unknown;
  discountPercent: number | null;
  discountRounding: string;
  webSpecialPrice: number | null;
  subMenus: BookingSubMenuForMenu[];
  // 小分類を経由せず中分類に直接ぶら下がるオプション（小分類が無い中分類でも数量選択できるようにする）。
  options: BookingOptionForMenu[];
};

type BookingCategoryForConvert = {
  id: string;
  title: string;
  setDiscountRules: unknown;
  menus: BookingMenuForConvert[];
};

// 100円未満を切り上げ/切り捨て/四捨五入する（値引き後価格・値引き額の端数処理用）。
export function roundAmount(value: number, mode: RoundingMode | string | undefined): number {
  if (mode === "UP") return Math.ceil(value / 100) * 100;
  if (mode === "DOWN") return Math.floor(value / 100) * 100;
  return Math.round(value);
}

// 個別値引き(%)を適用した価格を返す。値引きが無い場合は originalPrice を付けない
// （ServicePageBooking 側は originalPrice が無ければ通常価格のみを表示する）。
function applyDiscount(price: number, discountPercent: number | null, rounding?: string) {
  if (!discountPercent) return { price };
  const raw = (price * (100 - discountPercent)) / 100;
  const discounted = roundAmount(raw, rounding);
  return { price: discounted, originalPrice: price };
}

// WEB特価(絶対金額)が設定されていれば、%値引きより優先してそちらを使う
// （通常価格はbasePrice/price自身をそのまま「通常価格」として使う）。
function resolvePrice(price: number, webSpecialPrice: number | null | undefined, discountPercent: number | null, rounding?: string) {
  if (webSpecialPrice != null) return { price: webSpecialPrice, originalPrice: price };
  return applyDiscount(price, discountPercent, rounding);
}

// parentFoldItemId を指定すると小分類の下にネストされたオプション、省略すると中分類直下のオプションになる。
function mapOption(o: BookingOptionForMenu, parentFoldItemId?: string) {
  return {
    id: o.id,
    title: o.title,
    ...applyDiscount(o.price, o.discountPercent, o.discountRounding),
    durationMin: o.durationMin,
    durationMax: o.durationMax ?? o.durationMin,
    workContent: o.workContent || "",
    maxQty: o.maxQty ?? undefined,
    qtyDiscount: (o.qtyDiscountRules as { enabled: boolean; rules: { count: number; value: number }[]; rounding?: RoundingMode } | null) || undefined,
    comment: o.recommendPoint || "",
    parentFoldItemId,
  };
}

// group引数を指定すると、そのグループ(大分類)をまたいだ「まとめ割引」対象の main になる
// （main単体のfoldTitle内の値引きとは別の、複数メニューを横断した値引き）。
function menuToMain(menu: BookingMenuForConvert, group?: { id: string; title: string; setDiscount: SetDiscountRules }) {
  const setDiscount = (menu.setDiscountRules as SetDiscountRules) || {
    enabled: false,
    type: "amount" as const,
    rules: [],
  };

  const hasSubMenus = menu.subMenus.length > 0;
  const directOptions = menu.options || [];
  const hasDirectOptions = directOptions.length > 0;
  const mainPricing = resolvePrice(menu.basePrice, menu.webSpecialPrice, menu.discountPercent, menu.discountRounding);

  return {
    id: menu.id,
    title: menu.title,
    ...mainPricing,
    durationMin: menu.durationMin,
    durationMax: menu.durationMax ?? menu.durationMin,
    // 小分類は基本料金への「追加項目」であり、代替の選択肢ではない。
    // そのためメニュー自身は常に単体で選択可能（hasBaseSelection）にし、
    // 小分類・中分類直下オプションは基本料金の下に追加できる項目として別枠で表示する。
    hasBaseSelection: hasSubMenus || hasDirectOptions,
    comment: menu.recommendPoint || "",
    workContent: menu.workContent || "",
    cautionNote: menu.cautionNote || "",
    foldTitle: hasSubMenus || hasDirectOptions ? "追加できる項目" : "",
    foldItems: hasSubMenus
      ? menu.subMenus.map((sm) => ({
          id: sm.id,
          title: sm.title,
          ...resolvePrice(sm.price, sm.webSpecialPrice, sm.discountPercent, sm.discountRounding),
          durationMin: sm.durationMin,
          durationMax: sm.durationMax ?? sm.durationMin,
          workContent: sm.workContent || "",
          comment: sm.recommendPoint || "",
          cautionNote: sm.cautionNote || "",
        }))
      : [],
    options: [
      ...(hasSubMenus ? menu.subMenus.flatMap((sm) => sm.options.map((o) => mapOption(o, sm.id))) : []),
      ...directOptions.map((o) => mapOption(o)),
    ],
    setDiscount,
    groupId: group?.id,
    groupTitle: group?.title,
    groupSetDiscount: group?.setDiscount || undefined,
  };
}

// 大分類(BookingCategory)をリンクした場合、配下の中分類(BookingMenu)は個別リンクした場合と
// 全く同じ詳細度(小分類・追加オプションまで)でカレンダーに並べる。その代わり各メニューに
// 同じ groupId / groupSetDiscount を付与し、複数メニューを横断した「まとめ割引」を可能にする。
function categoryToMains(category: BookingCategoryForConvert) {
  const setDiscount = (category.setDiscountRules as SetDiscountRules) || {
    enabled: false,
    type: "amount" as const,
    rules: [],
  };
  const group = { id: category.id, title: category.title, setDiscount };
  return category.menus.map((menu) => menuToMain(menu, group));
}

// 一覧カードの簡易価格表示用に、リンクされた複数メニューの中から最安値(値引後)のものを選ぶ。
// 価格0円(未設定)のメニューは、他に価格が設定されたメニューがあればそちらを優先する
// （0円が「最安値」として選ばれてしまい、¥0〜のような誤表示になるのを防ぐ）。
export function cheapestBookingMenu<T extends { basePrice: number; priceNote?: string | null; discountPercent: number | null; discountRounding?: string; webSpecialPrice?: number | null }>(
  menus: T[]
): (T & { effectivePrice: number }) | null {
  if (menus.length === 0) return null;
  const priced = menus.filter((m) => m.basePrice > 0);
  const pool = priced.length > 0 ? priced : menus;
  return pool
    .map((m) => ({ ...m, effectivePrice: resolvePrice(m.basePrice, m.webSpecialPrice, m.discountPercent, m.discountRounding).price }))
    .reduce((cheapest, m) => (m.effectivePrice < cheapest.effectivePrice ? m : cheapest));
}

export function bookingMenusToBookingData(menus: BookingMenuForConvert[]) {
  return {
    mains: menus.map((m) => menuToMain(m)),
  };
}

// 大分類(BookingCategory)と中分類(BookingMenu)、両方をリンクできる前提で合成する。
// 大分類は配下の各メニューを個別リンクと同じ詳細度の main として展開し(まとめ割引の対象として
// グループ化)、中分類は単独の main になる。
// 個別リンクの中分類は「このページのメインメニュー」として明示的に選ばれたものなので、
// 大分類（まとめて追加された補助的なメニュー群）より先に表示する。
export function bookingSelectionToBookingData(
  categories: BookingCategoryForConvert[],
  menus: BookingMenuForConvert[]
) {
  return {
    mains: [
      ...menus.map((m) => menuToMain(m)),
      ...categories.flatMap(categoryToMains),
    ],
  };
}
