// @/src/lib/mail.ts
import nodemailer from "nodemailer";

function createTransporter() {
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = Number(process.env.SMTP_PORT);
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const isSecure = SMTP_PORT === 465;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: isSecure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/**
 * 認証コード送信
 */
export async function sendAuthCode(to: string, code: string) {
  const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Bright House" <${SMTP_FROM}>`,
    to,
    subject: "認証コード",
    text: `認証コード: ${code}\n\n有効期限は10分です。`,
  });
}

/**
 * 管理者へ新しい予約が入ったことを知らせるメール
 */
export async function sendBookingNotification(bookingData: any) {
  const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const transporter = createTransporter();

  const {
    customerName, phone, email, address, startTime, endTime,
    items, totalPrice, category, zip, contactMethod, totalMinutesDisplay, notes, dateUndecided
  } = bookingData;

const startFormatted = new Date(startTime).toLocaleString("ja-JP", {
  timeZone: "Asia/Tokyo",  // ← 追加
  year: "numeric", month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit"
});
const endFormatted = new Date(endTime).toLocaleString("ja-JP", {
  timeZone: "Asia/Tokyo",  // ← 追加
  hour: "2-digit", minute: "2-digit"
});
const scheduleText = dateUndecided
  ? "日程未定（お客様と改めて日程を調整してください）"
  : `${startFormatted} 〜 ${endFormatted}`;

  await transporter.sendMail({
    from: `"Bright House Booking" <${SMTP_FROM}>`,
    to: ADMIN_EMAIL,
    subject: `【新着予約】${customerName}様より申し込みがありました`,
    text: `
新しい予約申し込みが入りました。管理画面で詳細を確認し、確定処理を行ってください。

【予約内容】
------------------------------------------
■サービス: ${category}
■メニュー: ${items}
■希望日時: ${scheduleText}
■作業時間目安: ${totalMinutesDisplay}分
■概算合計金額: ¥${Number(totalPrice).toLocaleString()} (税込)

【お客様情報】
------------------------------------------
■お名前: ${customerName} 様
■電話番号: ${phone}
■メール: ${email}
■郵便番号: ${zip || "未入力"}
■住所: ${address || "未入力"}
■希望連絡方法: ${contactMethod}

【備考・要望】
------------------------------------------
${notes || "なし"}

------------------------------------------
管理画面で確認：https://brightofhouse.jp/admin/bookings
`,
  });
}

/**
 * お客様へ「仮予約・お問い合わせ受付」を知らせる自動返信メール
 */
export async function sendBookingConfirmationToUser(bookingData: any) {
  const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transporter = createTransporter();

  const {
    customerName, email, startTime, endTime,
    items, totalPrice, category, totalMinutesDisplay, dateUndecided
  } = bookingData;

const startFormatted = new Date(startTime).toLocaleString("ja-JP", {
  timeZone: "Asia/Tokyo",  // ← 追加
  year: "numeric", month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit"
});
const endFormatted = new Date(endTime).toLocaleString("ja-JP", {
  timeZone: "Asia/Tokyo",  // ← 追加
  hour: "2-digit", minute: "2-digit"
});
const scheduleText = dateUndecided
  ? "日程未定（担当者よりご連絡のうえ、日程を調整させていただきます）"
  : `${startFormatted} 〜 ${endFormatted}`;

  await transporter.sendMail({
    from: `"北海道ブライトオブハウス" <${SMTP_FROM}>`,
    to: email,
    subject: `【受付完了】仮予約・お問い合わせを承りました（${customerName}様）`,
    text: `
${customerName} 様

この度は「北海道ブライトオブハウス」へのお問い合わせ、誠にありがとうございます。
以下の内容で仮予約・お問い合わせを承りました。

現在、内容を確認しております。
担当者より折り返しのご連絡を差し上げますので、恐れ入りますが今しばらくお待ちください。

【お申し込み内容】
------------------------------------------
■サービス: ${category}
■メニュー: ${items}
■第一希望日時: ${scheduleText}
■作業時間目安: ${totalMinutesDisplay}分
■概算合計金額: ¥${Number(totalPrice).toLocaleString()} (税込)
------------------------------------------

※このメールは送信専用アドレスから自動送信されています。
※本メールは予約を確定させるものではございません。担当者からの連絡をもって確定となります。

もし、お急ぎの場合や内容の変更がある場合は、以下までお電話にてご連絡ください。

══════════════════════
北海道ブライトオブハウス
電話番号: 0120-792-684
営業時間: 9:00 〜 18:00
══════════════════════
`,
  });
}
