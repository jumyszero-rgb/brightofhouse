// @/src/lib/leadMail.ts
import nodemailer from "nodemailer";

/**
 * LPの軽量リードフォーム用メール。
 * 既存の mail.ts は startTime/endTime 前提のため流用せず、
 * 同じSMTP環境変数を使って「日時・金額なし」のリード通知を送る。
 */
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

export type LeadData = {
  name: string;
  phone: string;
  email?: string;
  zip?: string;
  address?: string;
  service: string; // 例: 浴室クリーニング / 排水管高圧洗浄
  timing?: string; // 希望時期
  area?: string; // ざっくりエリア（任意）
  contactMethod?: string; // 電話 / LINE / メール
  notes?: string;
  source?: string; // どのLPから来たか（例: lp/mizumawari/bathroom）
  photoUrls?: string[]; // お客様が添付した写真（現地の汚れ具合など）
  // 流入元（広告計測の補助。メールだけで検索広告／P-MAX／自然検索を見分けるため）
  gclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landingUrl?: string;
};

/** 流入元の表示ブロックを作る */
function sourceBlock(lead: LeadData): string {
  const inflow = lead.gclid
    ? "Google広告クリック（gclidあり）"
    : (lead.utm_source || lead.utm_medium || lead.utm_campaign ? "参照元あり" : "自然流入/不明");
  const lines = [
    `判定: ${inflow}`,
    `gclid: ${lead.gclid || "なし"}`,
    `utm_source: ${lead.utm_source || "-"} / utm_medium: ${lead.utm_medium || "-"} / utm_campaign: ${lead.utm_campaign || "-"}`,
  ];
  if (lead.utm_term || lead.utm_content) {
    lines.push(`utm_term: ${lead.utm_term || "-"} / utm_content: ${lead.utm_content || "-"}`);
  }
  lines.push(`着地ページ: ${lead.landingUrl || "-"}`);
  lines.push(`流入元LP: ${lead.source || "不明"}`);
  return lines.join("\n");
}

/** 管理者へのリード通知 */
export async function sendLeadNotification(lead: LeadData, confirmStatus?: string) {
  const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const transporter = createTransporter();

  const receivedAt = new Date().toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  await transporter.sendMail({
    from: `"Bright House LP" <${SMTP_FROM}>`,
    to: ADMIN_EMAIL,
    subject: `【LP問い合わせ】${lead.name}様（${lead.service}）`,
    text: `
広告LPから新しいお問い合わせ（リード）が入りました。
お客様へ折り返しのご連絡をお願いします。

【お問い合わせ内容】
------------------------------------------
■ご希望サービス: ${lead.service}
■ご希望時期: ${lead.timing || "未入力"}
■エリア: ${lead.area || "未入力"}

【お客様情報】
------------------------------------------
■お名前: ${lead.name} 様
■電話番号: ${lead.phone}
■郵便番号: ${lead.zip || "未入力"}
■住所: ${lead.address || "未入力"}
■メール: ${lead.email || "未入力"}
■希望連絡方法: ${lead.contactMethod || "未指定"}
■お客様への自動返信: ${confirmStatus || "不明"}

【ご要望・備考】
------------------------------------------
${lead.notes || "なし"}
${lead.photoUrls && lead.photoUrls.length > 0 ? `
【添付写真】
------------------------------------------
${lead.photoUrls.map((url, i) => `写真${i + 1}: ${url}`).join("\n")}
` : ""}
【流入元】
------------------------------------------
${sourceBlock(lead)}
------------------------------------------
受付日時: ${receivedAt}
`,
  });
}

/** お客様への自動返信（メールアドレスがある場合のみ送信） */
export async function sendLeadConfirmationToUser(lead: LeadData) {
  if (!lead.email) return;
  const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"北海道ブライトオブハウス" <${SMTP_FROM}>`,
    to: lead.email,
    subject: `【受付完了】お問い合わせを承りました（${lead.name}様）`,
    text: `
${lead.name} 様

この度は「北海道ブライトオブハウス」へお問い合わせいただき、誠にありがとうございます。
以下の内容で承りました。担当者より折り返しご連絡を差し上げますので、
恐れ入りますが今しばらくお待ちください。

【お問い合わせ内容】
------------------------------------------
■ご希望サービス: ${lead.service}
■ご希望時期: ${lead.timing || "ご相談"}
------------------------------------------

※このメールは送信専用アドレスから自動送信されています。
※お急ぎの場合は下記までお電話ください。

----------------------
北海道ブライトオブハウス
電話番号: 0120-792-684
営業時間: 9:00 〜 18:00
----------------------
`,
  });
}
