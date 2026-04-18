// @/src/app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, tel, message } = body;

    // 環境変数の読み込み
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = Number(process.env.SMTP_PORT);
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const MAIL_FROM = process.env.SMTP_FROM || SMTP_USER;
    const MAIL_TO   = process.env.CONTACT_MAIL_TO;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_TO) {
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    // ★修正ポイント: ポート465ならSSL(secure:true)、それ以外(587等)ならTLS(secure:false)にする
    // これで「Unexpected socket close」を防ぎます
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

    // 1. 管理者への通知メール
    await transporter.sendMail({
      from: `"Webサイトお問い合わせ" <${MAIL_FROM}>`,
      to: MAIL_TO,
      replyTo: email,
      subject: `【お問い合わせ】${name}様より`,
      text: `
Webサイトよりお問い合わせがありました。

■お名前: ${name}
■メール: ${email}
■電話番号: ${tel || "なし"}

■お問い合わせ内容:
${message}
      `,
    });

    // 2. お客様への自動返信メール
    await transporter.sendMail({
      from: `"北海道ブライトオブハウス" <${MAIL_FROM}>`,
      to: email,
      subject: "【自動返信】お問い合わせありがとうございます",
      text: `
${name} 様

お問い合わせありがとうございます。
以下の内容で受け付けいたしました。
担当者より折り返しご連絡させていただきます。

--------------------------------------------------
■お問い合わせ内容:
${message}
--------------------------------------------------

※このメールは自動送信されています。
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mail send error:", error);
    return NextResponse.json({ error: "メール送信に失敗しました" }, { status: 500 });
  }
}