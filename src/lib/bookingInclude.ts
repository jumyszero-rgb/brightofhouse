// @/src/lib/bookingInclude.ts
// 予約マスターの中分類（BookingMenu）を、カレンダー予約フォーム用に読み込むときの include（共通）。
// 小分類・オプションに加えて、ぶら下げた「ほかの中分類・小分類」（BookingMenuAttachment）の元データも一緒に読む。
// ※ ここを変えると、サービス詳細ページ・LP・管理画面のプレビューなど全部に効く。

/** ぶら下げ元として読む項目（名前・価格・目安時間・説明・数量） */
const attachSourceFields = {
  id: true,
  title: true,
  durationMin: true,
  durationMax: true,
  workContent: true,
  recommendPoint: true,
  cautionNote: true,
  discountPercent: true,
  discountRounding: true,
  webSpecialPrice: true,
  maxQty: true,
  qtyDiscountRules: true,
  priceFrom: true,
} as const;

/** オプションとして読む項目 */
const optionFields = {
  id: true,
  title: true,
  price: true,
  durationMin: true,
  durationMax: true,
  workContent: true,
  recommendPoint: true,
  maxQty: true,
  discountPercent: true,
  discountRounding: true,
  qtyDiscountRules: true,
  priceFrom: true,
  order: true,
} as const;

// 中分類をぶら下げたときは、その小分類（とオプション）も一緒に付いてくる（位置だけが変わる）
export const bookingAttachmentsInclude = {
  orderBy: { order: "asc" as const },
  include: {
    refMenu: {
      select: {
        ...attachSourceFields,
        basePrice: true,
        subMenus: {
          orderBy: { order: "asc" as const },
          select: { ...attachSourceFields, price: true, order: true, options: { orderBy: { order: "asc" as const }, select: optionFields } },
        },
        options: { orderBy: { order: "asc" as const }, select: optionFields },
      },
    },
    refSubMenu: { select: { ...attachSourceFields, price: true, options: { orderBy: { order: "asc" as const }, select: optionFields } } },
  },
} as const;

export const bookingMenuCalendarInclude = {
  subMenus: {
    include: { options: { orderBy: { order: "asc" as const } } },
    orderBy: { order: "asc" as const },
  },
  options: { orderBy: { order: "asc" as const } },
  attachments: bookingAttachmentsInclude,
} as const;
