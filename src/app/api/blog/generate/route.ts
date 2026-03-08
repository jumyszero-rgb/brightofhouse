// @/src/app/api/blog/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

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
  // ... (画像アップロード処理は変更なし)
};

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
   - **文字数は2000文字以上10000文字以内**で作成してください。
   - 冒頭に "${intro}"、末尾に "${outro}" を含めた、HTML形式のブログ本文（改行は<br>タグを使用）。
   - 見出し（h2, h3）を適切に使用し、読者が読みやすい構造にしてください。
   - 清掃のプロとしての知恵やメリットを盛り込み、親しみやすく信頼感のある内容にしてください。
4. insta: Instagram用（絵文字とハッシュタグ10個程度を含めてください）。
5. x: X (Twitter)用（140文字以内の興味を引く短文にしてください）。
6. google: Googleビジネスプロフィール用（地域名（札幌など）を含めた信頼感のあるフォーマルなトーンにしてください）。

【出力形式】
必ず以下の純粋なJSON形式のみで出力してください。
{
  "title": "タイトル文字列",
  "slug": "url-slug-string",
  "blog": "本文HTML",
  "insta": "インスタ用テキスト",
  "x": "X用テキスト",
  "google": "Google用テキスト"
}
`;

    const geminiUrl = `${process.env.GEMINI_PROXY_URL}/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();

    if (!result.candidates || !result.candidates[0]) {
      throw new Error("AIからの応答が不正です: " + JSON.stringify(result));
    }

    let aiText = result.candidates[0].content.parts[0].text;
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const data = JSON.parse(aiText);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("AI Generate Error:", error.message);
    return NextResponse.json({ error: "AI執筆に失敗しました: " + error.message }, { status: 500 });
  }
}