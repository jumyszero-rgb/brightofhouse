// @/src/app/api/service-pages/generate/route.ts
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

export async function POST(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { keywords } = await request.json();

    const prompt = `
あなたはプロの清掃業者「北海道ブライトオブハウス」のWebディレクター兼ライターです。
お客様が特定の清掃サービスについて詳しく知り、信頼して依頼したくなるような「サービス詳細解説ページ」のコンテンツを作成してください。

【キーワード】
${keywords}

【出力内容の指示】
1. title: サービスの内容がひと目で分かり、SEOにも強いタイトル。
2. slug: タイトルに関連した半角英数字とハイフンのみのURL用文字列。
3. catchphrase: 読者の心を掴む魅力的なキャッチコピー（1行）。
4. content: 
   - 文字数は1500文字程度。
   - HTML形式（改行は<br>、見出しはh2, h3を使用）。
   - プロの技術、使用する洗剤のこだわり、作業の流れ、お客様が得られるメリットを具体的に記述してください。
   - 専門用語は分かりやすく解説し、信頼感と安心感を与えてください。
5. metaDescription: 検索結果で表示される、120文字程度の概要文。
6. metaKeywords: 関連するキーワードを3〜5個、カンマ区切りで。

【出力形式】
必ず以下の「英語のキー名」を持つ純粋なJSON形式のみで出力してください。他の説明文は一切含めないでください。
{
  "title": "タイトル",
  "slug": "url-slug",
  "catchphrase": "キャッチコピー",
  "content": "本文HTML",
  "metaDescription": "SEO説明文",
  "metaKeywords": "キーワード1,キーワード2"
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
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const result = await response.json();
    if (!result.candidates || !result.candidates[0]) {
      throw new Error("AIからの応答が不正です: " + JSON.stringify(result));
    }

    let aiText = result.candidates[0].content.parts[0].text;
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // JSONのパースエラーを防止するため、最初と最後の波括弧を探す
    const startIdx = aiText.indexOf("{");
    const endIdx = aiText.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1) {
      aiText = aiText.substring(startIdx, endIdx + 1);
    }
    
    const data = JSON.parse(aiText);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("AI Generate Error:", error.message);
    return NextResponse.json({ error: "AI生成に失敗しました: " + error.message }, { status: 500 });
  }
}