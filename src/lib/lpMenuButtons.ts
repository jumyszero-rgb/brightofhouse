// @/src/lib/lpMenuButtons.ts
// ブロックLP「メニュー（予約マスター連動）」ブロック最下段のボタンの既定文言。
// 管理画面（ブロック編集）と公開ページ（LpBlocksRenderer）で共通。文言は管理画面で上書きできる。
export const MENU_BUTTON_DEFAULTS = {
  lead: "かんたん申込フォームで相談する",
  booking: "カレンダーから日時を選んで予約",
  phone: "電話で相談する",
  line: "LINEで相談する",
} as const;
export type MenuButtonKey = keyof typeof MENU_BUTTON_DEFAULTS;
