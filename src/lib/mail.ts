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