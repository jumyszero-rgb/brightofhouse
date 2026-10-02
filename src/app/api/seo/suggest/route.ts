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
あなたはSEO専門家です。以下のタイトルと本文を分析し、最適なSEOメタデータを生成してください。

タイトル: ${title}
本文: ${content.substring(0, 1500)}

【指示】
1. metaKeywords: 狙うべき重要キーワードを3〜5個、カンマ区切りで。
2. metaDescription: 120文字程度の魅力的な説明文。

JSON形式で出力してください:
{
  "metaKeywords": "キーワード1, キーワード2...",
  "metaDescription": "説明文..."
}
`;

    let aiText = await generateText(prompt, { maxTokens: 2048, json: true });
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return NextResponse.json(JSON.parse(aiText));

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}