// @/src/app/api/contact/route.ts
// 法人・業者様お問い合わせ（/contact）の送信先。
//  - 管理者へ通知メール（件名【法人・業者様お問い合わせ】）
//  - 送信者へビジネス文面の受付確認メール（自動返信）
//  - ボット対策：ハニーポット欄・簡易レート制限・文字数制限・メールヘッダ注入対策
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { CONTACT_CATEGORIES } from "@/lib/contactCategories";

export const runtime = "nodejs";

const LIMITS = {
  company: 100,
  name: 50,
  department: 100,
  email: 254,
  tel: 20,
  message: 3000,
} as const;

// 簡易レート制限（同一IPから10分間に5件まで。プロセス内メモリ）
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const g = globalThis as unknown as { __bhContactHits?: Map<string, number[]> };
const hits: Map<string, number[]> = g.__bhContactHits ?? (g.__bhContactHits = new Map());

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return list.length > MAX_PER_WINDOW;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
/** 件名・ヘッダに入る値は改行を除去（ヘッダ注入対策） */
const oneLine = (v: string) => v.replace(/[\r\n\t]+/g, " ").trim();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_RE = /^[0-9０-９+\-－ー()（）\s]*$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "入力内容を確認してください。" }, { status: 400 });
    }

    // ハニーポットに入力がある＝ボット。成功を装って破棄する
    if (str((body as Record<string, unknown>).website)) {
      return NextResponse.json({ success: true });
    }

    const b = body as Record<string, unknown>;
    const company = oneLine(str(b.company));
    const name = oneLine(str(b.name));
    const department = oneLine(str(b.department));
    const email = oneLine(str(b.email));
    const tel = oneLine(str(b.tel));
    const category = oneLine(str(b.category));
    const message = str(b.message);

    if (!company || !name || !email || !category || !message) {
      return NextResponse.json({ error: "必須項目をご入力ください。" }, { status: 400 });
    }
    if (
      company.length > LIMITS.company ||
      name.length > LIMITS.name ||
      department.length > LIMITS.department ||
      email.length > LIMITS.email ||
      tel.length > LIMITS.tel ||
      message.length > LIMITS.message
    ) {
      return NextResponse.json({ error: "入力文字数が上限を超えています。" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "メールアドレスの形式をご確認ください。" }, { status: 400 });
    }
    if (tel && !TEL_RE.test(tel)) {
      return NextResponse.json({ error: "電話番号の形式をご確認ください。" }, { status: 400 });
    }
    if (!(CONTACT_CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json({ error: "お問い合わせ種別を選択してください。" }, { status: 400 });
    }

    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: "短時間に複数回送信されたため、受付を一時停止しています。しばらく時間をおいて再度お試しください。" },
        { status: 429 }
      );
    }

    // 環境変数
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const MAIL_FROM = process.env.SMTP_FROM || SMTP_USER;
    const MAIL_TO = process.env.CONTACT_MAIL_TO;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_TO) {
      console.error("[contact] SMTP env missing");
      return NextResponse.json({ error: "送信できませんでした。時間をおいて再度お試しください。" }, { status: 500 });
    }

    // ポート465はSSL、それ以外（587等）はSTARTTLS
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });

    const receivedAt = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
    const detail = [
      `■会社名・団体名：${company}`,
      `■ご担当者名　　：${name} 様`,
      `■部署名・役職　：${department || "（未記入）"}`,
      `■メールアドレス：${email}`,
      `■電話番号　　　：${tel || "（未記入）"}`,
      `■お問い合わせ種別：${category}`,
      ``,
      `■お問い合わせ内容：`,
      message,
    ].join("\n");

    // 1. 管理者への通知メール
    await transporter.sendMail({
      from: `"Webサイト（法人・業者様窓口）" <${MAIL_FROM}>`,
      to: MAIL_TO,
      replyTo: email,
      subject: `【法人・業者様お問い合わせ】${category}／${company} ${name}様`,
      text: [
        `Webサイトの「法人・業者様のお問い合わせ」フォームより送信がありました。`,
        `※ お客様からのサービス問い合わせではありません。`,
        ``,
        `受付日時：${receivedAt}`,
        ``,
        detail,
        ``,
        `--------------------------------------------------`,
        `送信元IP：${ip}`,
      ].join("\n"),
    });

    // 2. 送信者への受付確認メール（自動返信）
    try {
      await transporter.sendMail({
        from: `"北海道ブライトオブハウス（合同会社むすびえむ）" <${MAIL_FROM}>`,
        to: email,
        subject: "【受付完了】お問い合わせを承りました｜北海道ブライトオブハウス",
        text: [
          `${company}`,
          `${department ? department + " " : ""}${name} 様`,
          ``,
          `このたびは、北海道ブライトオブハウス（合同会社むすびえむ）へ`,
          `お問い合わせいただき、誠にありがとうございます。`,
          ``,
          `以下の内容にてお問い合わせを承りました。`,
          `内容を確認のうえ、通常3営業日以内に担当者よりメールにてご連絡いたします。`,
          `なお、お問い合わせの内容によっては、ご返信までにお時間をいただく場合や、`,
          `ご返信を控えさせていただく場合がございます。あらかじめご了承ください。`,
          ``,
          `==================================================`,
          `受付日時：${receivedAt}`,
          ``,
          detail,
          `==================================================`,
          ``,
          `※ 本メールはシステムより自動送信しております。`,
          `※ 本メールにお心当たりのない場合は、お手数ですが破棄いただきますようお願いいたします。`,
          ``,
          `--------------------------------------------------`,
          `北海道ブライトオブハウス（合同会社むすびえむ）`,
          `https://brightofhouse.jp/`,
          `--------------------------------------------------`,
        ].join("\n"),
      });
    } catch (e) {
      // 自動返信の失敗で送信自体を失敗扱いにしない（管理者通知は届いている）
      console.error("[contact] auto-reply failed:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[contact] mail send error:", error);
    return NextResponse.json({ error: "送信できませんでした。時間をおいて再度お試しください。" }, { status: 500 });
  }
}
