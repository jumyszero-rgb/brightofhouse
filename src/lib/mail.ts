// @/src/lib/mail.ts
import nodemailer from "nodemailer";

export async function sendAuthCode(to: string, code: string) {
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = Number(process.env.SMTP_PORT);
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

  // ★修正ポイント: ポート465ならSSL(secure:true)、それ以外ならTLS(secure:false)にする
  const isSecure = SMTP_PORT === 465;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: isSecure, 
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Bright House Admin" <${SMTP_FROM}>`,
    to,
    subject: "【管理画面】認証コードのお知らせ",
    text: `管理画面へのログイン認証コードです。\n\nコード: ${code}\n\n有効期限は10分間です。`,
  });
}

/**
 * 管理者へ新しい予約が入ったことを知らせるメール
 */
export async function sendBookingNotification(bookingData: any) {
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = Number(process.env.SMTP_PORT);
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

  const isSecure = SMTP_PORT === 465;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: isSecure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const { customerName, phone, email, address, startTime, items, totalPrice, category } = bookingData;
  const formattedDate = new Date(startTime).toLocaleString("ja-JP");

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
■日時: ${formattedDate} 〜
■合計金額: ¥${totalPrice.toLocaleString()} (税込)

【お客様情報】
------------------------------------------
■お名前: ${customerName} 様
■電話番号: ${phone}
■メール: ${email}
■住所: ${address || "未入力"}

【備考・要望】
------------------------------------------
${bookingData.notes || "なし"}

------------------------------------------
管理画面で確認：https://brightofhouse.jp/admin/bookings
`,
  });
}

/**
 * お客様へ「仮予約・お問い合わせ受付」を知らせる自動返信メール
 */
export async function sendBookingConfirmationToUser(bookingData: any) {
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = Number(process.env.SMTP_PORT);
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

  const isSecure = SMTP_PORT === 465;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: isSecure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const { customerName, email, startTime, items, totalPrice, category } = bookingData;
  const formattedDate = new Date(startTime).toLocaleString("ja-JP", {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

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
■第一希望日時: ${formattedDate} 〜
■概算合計金額: ¥${totalPrice.toLocaleString()} (税込)
------------------------------------------

※このメールは送信専用アドレスから自動送信されています。
※本メールは予約を確定させるものではございません。担当者からの連絡をもって確定となります。

もし、お急ぎの場合や内容の変更がある場合は、以下までお電話にてご連絡ください。

━━━━━━━━━━━━━━━━━━━━━━
北海道ブライトオブハウス
電話番号: 0120-792-684
営業時間: 9:00 〜 18:00
━━━━━━━━━━━━━━━━━━━━━━
`,
  });
}