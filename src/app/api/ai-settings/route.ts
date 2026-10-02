// @/src/app/api/ai-settings/route.ts
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
  } catch {
    return false;
  }
}

// APIキーは画面に生の値を返さず、「設定済みか」だけを返す
export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const s = await prisma.aiSettings.findUnique({ where: { id: "main" } });
    return NextResponse.json({
      provider: s?.provider || "claude",
      anthropicModel: s?.anthropicModel || "",
      openaiModel: s?.openaiModel || "",
      geminiModel: s?.geminiModel || "",
      hasAnthropicKey: !!s?.anthropicApiKey,
      hasOpenaiKey: !!s?.openaiApiKey,
      hasGeminiKey: !!s?.geminiApiKey,
    });
  } catch {
    // テーブル未作成時のデフォルト
    return NextResponse.json({
      provider: "claude",
      anthropicModel: "",
      openaiModel: "",
      geminiModel: "",
      hasAnthropicKey: false,
      hasOpenaiKey: false,
      hasGeminiKey: false,
    });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const provider = ["claude", "openai", "gemini"].includes(body.provider)
      ? body.provider
      : "claude";

    // モデルは常に上書き（空文字は空に）
    const base: any = {
      provider,
      anthropicModel: body.anthropicModel ?? "",
      openaiModel: body.openaiModel ?? "",
      geminiModel: body.geminiModel ?? "",
    };

    // キーは「新しい値が入力された時だけ」上書き（空なら既存を維持）
    const keyUpdate: any = {};
    if (typeof body.anthropicApiKey === "string" && body.anthropicApiKey.trim() !== "")
      keyUpdate.anthropicApiKey = body.anthropicApiKey.trim();
    if (typeof body.openaiApiKey === "string" && body.openaiApiKey.trim() !== "")
      keyUpdate.openaiApiKey = body.openaiApiKey.trim();
    if (typeof body.geminiApiKey === "string" && body.geminiApiKey.trim() !== "")
      keyUpdate.geminiApiKey = body.geminiApiKey.trim();

    // 明示的な削除（"__CLEAR__" が来たら空にする）
    if (body.anthropicApiKey === "__CLEAR__") keyUpdate.anthropicApiKey = null;
    if (body.openaiApiKey === "__CLEAR__") keyUpdate.openaiApiKey = null;
    if (body.geminiApiKey === "__CLEAR__") keyUpdate.geminiApiKey = null;

    await prisma.aiSettings.upsert({
      where: { id: "main" },
      update: { ...base, ...keyUpdate },
      create: { id: "main", ...base, ...keyUpdate },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "保存に失敗しました: " + (e as Error).message },
      { status: 500 }
    );
  }
}
