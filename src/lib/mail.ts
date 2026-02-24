// @/src/lib/mail.ts
import nodemailer from "nodemailer";

export async function sendAuthCode(to: string, code: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // 587番ポート(TLS)の場合はfalse
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Bright House Admin" <${process.env.SMTP_FROM}>`,
    to,
    subject: "【管理画面】認証コードのお知らせ",
    text: `管理画面へのログイン認証コードです。\n\nコード: ${code}\n\n有効期限は10分間です。`,
  });
}