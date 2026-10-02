// @/src/app/api/before-after/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { generateText } from "@/lib/ai";

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
    const { title, beforeText, afterText } = await request.json();

    const prompt = `
あなたはプロの清掃業者「北海道ブライトオブハウス」のスタッフです。
施工実績の「ビフォーの状態」と「アフターの状態」を、それぞれ魅力的に説明してください。

【作業タイトル】
${title}
【ビフォーの状態（入力）】
${beforeText}
【アフターの状態（入力）】
${afterText}

【指示】
・プロとしてのこだわりをアピール。
・beforeContent: 作業前の不便さや汚れの悩み。
・afterContent: 作業後の快適さや具体的な変化。
・各100〜200文字程度。

【出力形式】
必ず以下のJSON形式のみで出力してください。
{
  "beforeContent": "ビフォーの説明文",
  "afterContent": "アフターの説明文"
}
`;

    let aiText = await generateText(prompt, { maxTokens: 2048, json: true });
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const data = JSON.parse(aiText);
    return NextResponse.json({ 
      beforeContent: data.beforeContent,
      afterContent: data.afterContent 
    });

  } catch (error: any) {
    console.error("AI Generate Error:", error.message);
    return NextResponse.json({ error: "AI執筆に失敗しました" }, { status: 500 });
  }
}