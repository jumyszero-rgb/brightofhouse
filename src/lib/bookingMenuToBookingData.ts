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
  priceFrom?: boolean;
  order?: number;
  calendarOrder?: number | null;
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
  maxQty: number | null;
  qtyDiscountRules: unknown;
  priceFrom?: boolean;
  order?: number;
  calendarOrder?: number | null;
  options: BookingOptionForMenu[];
};

/** ぶら下げた項目の元データ（中分類なら basePrice、小分類なら price） */
type AttachSource = {
  id: string;
  title: string;
  durationMin: number;
  durationMax: number | null;
  workContent: string | null;
  recommendPoint: string | null;
  cautionNote: string | null;
  discountPercent: number | null;
  discountRounding: string;
  webSpecialPrice: number | null;
  maxQty: number | null;
  qtyDiscountRules: unknown;
  priceFrom?: boolean;
  basePrice?: number;
  price?: number;
  // 中分類をぶら下げたときに一緒に付いてくる小分類・オプション
  subMenus?: (AttachSource & { order?: number; options?: BookingOptionForMenu[] })[];
  options?: BookingOptionForMenu[];
};
type BookingAttachmentForConvert = {
  id: string;
  order?: number;
  refMenu?: AttachSource | null;
  refSubMenu?: AttachSource | null;
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
  maxQty: number | null;
  qtyDiscountRules: unknown;
  priceFrom?: boolean;
  /** false ならカレンダー（予約フォーム）に出さない（作成中の中分類など）。未設定は表示 */
  showOnCalendar?: boolean;
  order?: number;
  calendarOrder?: number | null;
  subMenus: BookingSubMenuForMenu[];
  // 小分類を経由せず中分類に直接ぶら下がるオプション（小分類が無い中分類でも数量選択できるようにする）。
  options: BookingOptionForMenu[];
  // ほかの大分類の中分類・小分類を参照でぶら下げたもの（予約マスターの「ほかの項目をぶら下げる」）。
  attachments?: BookingAttachmentForConvert[];
};

type BookingCategoryForConvert = {
  id: string;
  title: string;
  setDiscountRules: unknown;
  order?: number;
  calendarOrder?: number | null;
  menus: BookingMenuForConvert[];
};

// カレンダー（予約フォーム）の表示順で安定ソート。
// calendarOrder（カレンダー専用の表示順）があれば最優先、無ければ従来の order にフォールバック。
// ※ここはカレンダーの並びだけに使う。サービス一覧・管理画面の並びには影響しない（それらは order のまま）。
const calOrd = (x: { calendarOrder?: number | null; order?: number }) =>
  (x.calendarOrder ?? x.order ?? 0);
const byOrder = <T extends { calendarOrder?: number | null; order?: number }>(arr: T[]): T[] =>
  [...arr].sort((a, b) => calOrd(a) - calOrd(b));

/** カレンダーに出す中分類だけ（予約マスターの「カレンダーに表示」がオフのものを除く） */
const calendarVisible = <T extends { showOnCalendar?: boolean }>(arr: T[]): T[] =>
  (arr || []).filter((m) => m.showOnCalendar !== false);

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
export function resolvePrice(price: number, webSpecialPrice: number | null | undefined, discountPercent: number | null, rounding?: string) {
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
    from: !!o.priceFrom,
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
  // ぶら下げた項目（元の項目の名前・価格・説明をそのまま使う）。小分類の後ろに「追加できる項目」として並べる。
  //  - 小分類をぶら下げた → 1項目（その小分類のオプションは、チェック時に開くオプション）
  //  - 中分類をぶら下げた → その中分類が1項目になり、チェックすると下にその小分類が開く（位置だけが変わり、中身はそのまま）
  //    中分類直下のオプション・小分類のオプションも、それぞれの下に付いてくる
  //  id は「att:ぶら下げID(:元のID)」にする（同じ項目を別の中分類にもぶら下げたとき、選択が連動しないように）。
  const toFold = (src: AttachSource, id: string, base: number, parentFoldItemId?: string, groupOnly = false) => ({
    id,
    title: src.title,
    ...resolvePrice(base, src.webSpecialPrice, src.discountPercent, src.discountRounding),
    from: !!src.priceFrom,
    // 基本料金0円で小分類を持つ中分類は「開くための見出し」なので、時間も足さない
    durationMin: groupOnly ? 0 : src.durationMin,
    durationMax: groupOnly ? 0 : (src.durationMax ?? src.durationMin),
    workContent: src.workContent || "",
    comment: src.recommendPoint || "",
    cautionNote: src.cautionNote || "",
    maxQty: groupOnly ? undefined : (src.maxQty ?? undefined),
    qtyDiscount: groupOnly ? undefined : ((src.qtyDiscountRules as { enabled: boolean; rules: { count: number; value: number }[]; rounding?: RoundingMode } | null) || undefined),
    ...(parentFoldItemId ? { parentFoldItemId } : {}),
    ...(groupOnly ? { groupOnly: true } : {}),
  });
  const attachedItems: ReturnType<typeof toFold>[] = [];
  const attachedOptions: ReturnType<typeof mapOption>[] = [];
  const optWithId = (o: BookingOptionForMenu, newId: string, parentId: string) => ({ ...mapOption(o, parentId), id: newId });
  for (const a of menu.attachments || []) {
    if (a.refSubMenu) {
      const sid = `att:${a.id}`;
      attachedItems.push(toFold(a.refSubMenu, sid, a.refSubMenu.price ?? 0));
      for (const o of byOrder(a.refSubMenu.options || [])) attachedOptions.push(optWithId(o, `${sid}:o:${o.id}`, sid));
    } else if (a.refMenu) {
      const m = a.refMenu;
      const pid = `att:${a.id}`;
      const subs = byOrder(m.subMenus || []);
      const groupOnly = !m.basePrice && m.webSpecialPrice == null && subs.length > 0;
      attachedItems.push(toFold(m, pid, m.basePrice ?? 0, undefined, groupOnly));
      for (const o of byOrder(m.options || [])) attachedOptions.push(optWithId(o, `${pid}:o:${o.id}`, pid));
      for (const sm of subs) {
        const cid = `${pid}:${sm.id}`;
        attachedItems.push(toFold(sm, cid, sm.price ?? 0, pid));
        for (const o of byOrder(sm.options || [])) attachedOptions.push(optWithId(o, `${cid}:o:${o.id}`, cid));
      }
    }
  }
  const hasFoldItems = hasSubMenus || attachedItems.length > 0;
  const mainPricing = resolvePrice(menu.basePrice, menu.webSpecialPrice, menu.discountPercent, menu.discountRounding);

  return {
    id: menu.id,
    title: menu.title,
    // 所属する大分類ID（最低申込点数の判定用）。Prisma の include で categoryId も返ってくる。
    categoryId: (menu as { categoryId?: string }).categoryId ?? group?.id,
    ...mainPricing,
    from: !!menu.priceFrom,
    durationMin: menu.durationMin,
    durationMax: menu.durationMax ?? menu.durationMin,
    // 小分類は基本料金への「追加項目」であり、代替の選択肢ではない。
    // そのためメニュー自身は常に単体で選択可能（hasBaseSelection）にし、
    // 小分類・中分類直下オプションは基本料金の下に追加できる項目として別枠で表示する。
    hasBaseSelection: hasFoldItems || hasDirectOptions,
    maxQty: menu.maxQty ?? undefined,
    qtyDiscount: (menu.qtyDiscountRules as { enabled: boolean; rules: { count: number; value: number }[]; rounding?: RoundingMode } | null) || undefined,
    comment: menu.recommendPoint || "",
    workContent: menu.workContent || "",
    cautionNote: menu.cautionNote || "",
    foldTitle: hasFoldItems || hasDirectOptions ? "追加できる項目" : "",
    foldItems: [
      ...byOrder(menu.subMenus).map((sm) => ({
          id: sm.id,
          title: sm.title,
          ...resolvePrice(sm.price, sm.webSpecialPrice, sm.discountPercent, sm.discountRounding),
          from: !!sm.priceFrom,
          durationMin: sm.durationMin,
          durationMax: sm.durationMax ?? sm.durationMin,
          workContent: sm.workContent || "",
          comment: sm.recommendPoint || "",
          cautionNote: sm.cautionNote || "",
          maxQty: sm.maxQty ?? undefined,
          qtyDiscount: (sm.qtyDiscountRules as { enabled: boolean; rules: { count: number; value: number }[]; rounding?: RoundingMode } | null) || undefined,
        })),
      ...attachedItems,
    ],
    options: [
      ...(hasSubMenus ? byOrder(menu.subMenus).flatMap((sm) => byOrder(sm.options).map((o) => mapOption(o, sm.id))) : []),
      ...byOrder(directOptions).map((o) => mapOption(o)),
      ...attachedOptions,
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
function categoryToMains(category: BookingCategoryForConvert, menuOrder?: string[]) {
  const setDiscount = (category.setDiscountRules as SetDiscountRules) || {
    enabled: false,
    type: "amount" as const,
    rules: [],
  };
  const group = { id: category.id, title: category.title, setDiscount };
  return sortByIdList(byOrder(calendarVisible(category.menus)), menuOrder).map((menu) => menuToMain(menu, group));
}

/**
 * ids（LPごとに指定した並び）にある項目をその順で先頭に、無い項目はもとの順のまま後ろに並べる。
 * ids が空なら何もしない（予約マスターのカレンダー表示順のまま）。
 */
function sortByIdList<T extends { id: string }>(arr: T[], ids?: string[]): T[] {
  if (!ids || ids.length === 0) return arr;
  const rank = new Map(ids.map((id, i) => [id, i]));
  return arr
    .map((x, i) => ({ x, i }))
    .sort((a, b) => {
      const ra = rank.has(a.x.id) ? rank.get(a.x.id)! : ids.length + a.i;
      const rb = rank.has(b.x.id) ? rank.get(b.x.id)! : ids.length + b.i;
      return ra - rb;
    })
    .map(({ x }) => x);
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
    mains: byOrder(calendarVisible(menus)).map((m) => menuToMain(m)),
  };
}

// 大分類(BookingCategory)と中分類(BookingMenu)、両方をリンクできる前提で合成する。
// 大分類は配下の各メニューを個別リンクと同じ詳細度の main として展開し(まとめ割引の対象として
// グループ化)、中分類は単独の main になる。
// 個別リンクの中分類は「このページのメインメニュー」として明示的に選ばれたものなので、
// 大分類（まとめて追加された補助的なメニュー群）より先に表示する。
export function bookingSelectionToBookingData(
  categories: BookingCategoryForConvert[],
  menus: BookingMenuForConvert[],
  // LPのカレンダー予約ブロック用：大分類の並び（選んだ順）と、中分類の並びをLPごとに指定できる。
  // 省略時は従来どおり予約マスターのカレンダー表示順。
  order?: { categoryIds?: string[]; menuIds?: string[] }
) {
  const cats = order?.categoryIds?.length ? sortByIdList(byOrder(categories), order.categoryIds) : byOrder(categories);
  return {
    mains: [
      ...byOrder(calendarVisible(menus)).map((m) => menuToMain(m)),
      ...cats.flatMap((c) => categoryToMains(c, order?.menuIds)),
    ],
  };
}
