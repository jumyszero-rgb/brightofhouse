// @/src/app/api/blog/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch { return false; }
}

const uploadToR2 = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const webpBuffer = await sharp(buffer)
    .rotate()
    .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const fileName = `blog_thumbnails/${uuidv4()}.webp`;
  await r2Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: webpBuffer,
    ContentType: "image/webp",
  }));
  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
};

function robustJsonParse(text: string) {
  try { return JSON.parse(text); } catch {}

  let cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try { return JSON.parse(cleaned); } catch {}

  // 最終手段: 各フィールドを正規表現で抽出
  const fields: Record<string, string> = {};
  const keys = ["title", "slug", "blog", "insta", "x", "google"];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    let pattern: RegExp;
    if (nextKey) {
      pattern = new RegExp(`"${key}"\\s*:\\s*"([\\s\\S]*?)"\\s*,\\s*"${nextKey}"`, "m");
    } else {
      pattern = new RegExp(`"${key}"\\s*:\\s*"([\\s\\S]*?)"\\s*}`, "m");
    }
    const m = text.match(pattern);
    if (m) {
      fields[key] = m[1].replace(/\n/g, "\\n").replace(/"/g, "");
    }
  }
  if (Object.keys(fields).length >= 4) {
    return fields;
  }

  throw new Error("JSONパースに失敗しました。AIの出力形式が不正です。");
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { keywords } = await request.json();

    const settings = await prisma.blogSettings.findUnique({ where: { id: "main" } });
    const fixedKeywords = settings?.fixedKeywords || "";
    const intro = settings?.defaultIntro || "";
    const outro = settings?.defaultOutro || "";

    const existingPosts = await prisma.blogPost.findMany({
      select: { title: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const existingTitles = existingPosts.map(post => post.title).join(", ");

    const prompt = `
あなたはプロの清掃業者「北海道ブライトオブハウス」の広報担当です。
以下のキーワードに基づき、ブログ記事とSNS投稿を作成してください。
過去のブログ記事の内容と重複しないように、新しい視点や情報を盛り込んでください。

【キーワード】
今回のテーマ: ${keywords}
必ず含める言葉: ${fixedKeywords}

【過去のブログ記事のタイトル（参考にし、重複しないように）】
${existingTitles ? existingTitles : "過去記事はありません。自由に生成してください。"}

【出力内容の指示】
1. title: SEOに強く、読者がクリックしたくなる魅力的なタイトル。
2. slug: タイトルに関連した半角英数字とハイフンのみのURL用文字列。
3. blog:
   - 文字数は2000文字以上10000文字以内。
   - 冒頭に "${intro}"、末尾に "${outro}" を含めた、HTML形式のブログ本文。
   - HTMLの改行は<br>タグを使用してください。JSON文字列内に生の改行を入れないでください。
   - 見出し（h2, h3）を適切に使用し、読者が読みやすい構造にしてください。
   - 清掃のプロとしての知恵やメリットを盛り込み、親しみやすく信頼感のある内容にしてください。
4. insta: Instagram用（絵文字とハッシュタグ10個程度を含めてください）。※HTMLタグ禁止、電話番号禁止、プレーンテキストのみ。
5. x: X (Twitter)用（140文字以内の興味を引く短文にしてください）。※HTMLタグ禁止、電話番号禁止、プレーンテキストのみ。
6. google: Googleビジネスプロフィール用（地域名（札幌など）を含めた信頼感のあるフォーマルなトーンにしてください）。※HTMLタグ禁止、<br>禁止、電話番号禁止、プレーンテキストのみ。金額を記載する場合は冒頭に入れてください。

【重要】出力は純粋なJSONのみ。コードブロックや説明文は不要です。全てのHTMLは1行の文字列にしてください（改行は<br>で表現）。
{
  "title": "タイトル文字列",
  "slug": "url-slug-string",
  "blog": "本文HTML（1行、改行は<br>で）",
  "insta": "インスタ用テキスト",
  "x": "X用テキスト",
  "google": "Google用テキスト"
}
`;

    const geminiModel = process.env.GEMINI_MODEL_NAME || "gemini-pro";
    const geminiApiVersion = process.env.GEMINI_API_VERSION || "v1";

    const geminiUrl = `${process.env.GEMINI_PROXY_URL}/${geminiApiVersion}/models/${geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
          response_schema: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              slug: { type: "STRING" },
              blog: { type: "STRING" },
              insta: { type: "STRING" },
              x: { type: "STRING" },
              google: { type: "STRING" }
            },
            required: ["title", "slug", "blog", "insta", "x", "google"]
          }
        }
      })
    });

    const result = await response.json();

    if (!result.candidates || !result.candidates[0]) {
      throw new Error("AIからの応答が不正です: " + JSON.stringify(result).substring(0, 500));
    }

    let aiText = result.candidates[0].content.parts[0].text;
    console.log("AI raw response length:", aiText.length);

    const data = robustJsonParse(aiText);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("AI Generate Error:", error.message);
    return NextResponse.json({ error: "AI執筆に失敗しました: " + error.message }, { status: 500 });
  }
}
