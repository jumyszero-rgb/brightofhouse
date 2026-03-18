// @/src/app/api/seo/suggest/route.ts
import { NextRequest, NextResponse } from "next/server";
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
    const { title, content } = await request.json();

    const prompt = `
あなたはSEO専門家です。以下のコンテンツ（タイトルと本文）を分析し、Google検索で上位表示されるためのSEOメタデータを生成してください。

タイトル: ${title}
本文: ${content.substring(0, 2000)} // 長すぎる場合はカット

【指示】
1. metaKeywords: このページで狙うべき重要キーワードを3〜5個、カンマ区切りで抽出してください（例: 札幌, キッチン清掃, 料金）。詰め込みすぎず、本当に重要なものだけに絞ってください。
2. metaDescription: 検索結果でクリックしたくなる、120文字程度の魅力的な説明文を作成してください。

【出力形式】
必ず以下の純粋なJSON形式のみで出力してください。
{
  "metaKeywords": "キーワード1, キーワード2, キーワード3",
  "metaDescription": "説明文テキスト"
}
`;

    const geminiModel = process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash";
    const geminiApiVersion = process.env.GEMINI_API_VERSION || "v1beta";
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
    let aiText = result.candidates[0].content.parts[0].text;
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return NextResponse.json(JSON.parse(aiText));

  } catch (error: any) {
    return NextResponse.json({ error: "SEO提案に失敗しました" }, { status: 500 });
  }
}