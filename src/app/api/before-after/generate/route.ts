// @/src/app/api/before-after/generate/route.ts
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
    const { title, beforeText, afterText } = await request.json();

    const prompt = `
あなたはプロの清掃業者「北海道ブライトオブハウス」のスタッフです。
お客様に喜んでいただけるよう、施工実績（ビフォーアフター）の魅力的な説明文を書いてください。

【作業タイトル】
${title}

【ビフォーの状態（お客様の悩み）】
${beforeText}

【アフターの状態（作業後の変化）】
${afterText}

【指示】
・清掃のプロとしてのこだわりや技術をアピールしてください。
・親しみやすく、かつ信頼感のあるトーンで書いてください。
・文字数は200文字〜400文字程度で、適宜改行を入れて読みやすくしてください。
・HTMLタグは含めず、純粋なテキストのみを出力してください。
`;

    const geminiModel = process.env.GEMINI_MODEL_NAME || "gemini-pro";
    const geminiApiVersion = process.env.GEMINI_API_VERSION || "v1";
    const geminiUrl = `${process.env.GEMINI_PROXY_URL}/${geminiApiVersion}/models/${geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      })
    });

    const result = await response.json();
    if (!result.candidates || !result.candidates[0]) {
      throw new Error("AIからの応答が不正です");
    }

    const aiText = result.candidates[0].content.parts[0].text.trim();
    return NextResponse.json({ description: aiText });

  } catch (error: any) {
    console.error("AI Generate Error:", error.message);
    return NextResponse.json({ error: "AI執筆に失敗しました" }, { status: 500 });
  }
}