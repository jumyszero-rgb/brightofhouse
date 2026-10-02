// @/src/lib/ai.ts
// AIテキスト生成の共通ヘルパー（プロバイダ切替対応）。
//
// 設定の優先順位: 管理画面の「AI設定」(DB: AiSettings) → 環境変数。
//   プロバイダ: AiSettings.provider（なければ AI_PROVIDER、既定 claude）
//   各キー/モデル: DBの値（空なら環境変数にフォールバック）
//
//   Claude :  ANTHROPIC_API_KEY / ANTHROPIC_MODEL
//   OpenAI :  OPENAI_API_KEY    / OPENAI_MODEL
//   Gemini :  GEMINI_API_KEY    / GEMINI_MODEL_NAME, GEMINI_API_VERSION, GEMINI_PROXY_URL
//
// 将来プロバイダを増やす場合は generateText の分岐に1件追加するだけで対応可能。

import prisma from "@/lib/prisma";

export type AIOptions = {
  maxTokens?: number;
  json?: boolean; // JSONのみで返してほしい場合 true
  system?: string; // システムプロンプト（未指定でjson=trueなら自動付与）
};

export type AIProvider = "claude" | "openai" | "gemini";

type ResolvedConfig = {
  provider: AIProvider;
  anthropicApiKey?: string;
  anthropicModel?: string;
  openaiApiKey?: string;
  openaiModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
};

const nz = (v?: string | null) => (v && v.trim() !== "" ? v.trim() : undefined);

async function resolveConfig(): Promise<ResolvedConfig> {
  let db: any = null;
  try {
    db = await prisma.aiSettings.findUnique({ where: { id: "main" } });
  } catch {
    // AiSettingsテーブル未作成でも環境変数で動作
  }
  const providerRaw = (nz(db?.provider) || process.env.AI_PROVIDER || "claude").toLowerCase();
  const provider: AIProvider =
    providerRaw === "openai" ? "openai" : providerRaw === "gemini" ? "gemini" : "claude";

  return {
    provider,
    anthropicApiKey: nz(db?.anthropicApiKey) || nz(process.env.ANTHROPIC_API_KEY),
    anthropicModel: nz(db?.anthropicModel) || nz(process.env.ANTHROPIC_MODEL),
    openaiApiKey: nz(db?.openaiApiKey) || nz(process.env.OPENAI_API_KEY),
    openaiModel: nz(db?.openaiModel) || nz(process.env.OPENAI_MODEL),
    geminiApiKey: nz(db?.geminiApiKey) || nz(process.env.GEMINI_API_KEY),
    geminiModel: nz(db?.geminiModel) || nz(process.env.GEMINI_MODEL_NAME),
  };
}

export async function generateText(prompt: string, opts: AIOptions = {}): Promise<string> {
  const cfg = await resolveConfig();
  switch (cfg.provider) {
    case "openai":
      return callOpenAI(prompt, opts, cfg);
    case "gemini":
      return callGemini(prompt, opts, cfg);
    case "claude":
    default:
      return callClaude(prompt, opts, cfg);
  }
}

function jsonSystem(opts: AIOptions): string | undefined {
  return (
    opts.system ??
    (opts.json
      ? "あなたは出力をJSONのみで返します。コードフェンス(```)や説明文は一切付けず、有効なJSONオブジェクトだけを返してください。"
      : undefined)
  );
}

// ---- Claude (Anthropic Messages API) ----
async function callClaude(prompt: string, opts: AIOptions, cfg: ResolvedConfig): Promise<string> {
  const apiKey = cfg.anthropicApiKey;
  if (!apiKey) throw new Error("Claude の APIキーが未設定です（管理画面のAI設定、または ANTHROPIC_API_KEY）");
  const model = cfg.anthropicModel || "claude-sonnet-4-5";
  const system = jsonSystem(opts);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 4096,
      ...(system ? { system } : {}),
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error("Claude APIエラー: " + JSON.stringify(result).substring(0, 500));
  const text: string | undefined = result?.content?.[0]?.text;
  if (!text) throw new Error("AI応答が不正です(Claude): " + JSON.stringify(result).substring(0, 500));
  return text;
}

// ---- OpenAI (Chat Completions API) ----
async function callOpenAI(prompt: string, opts: AIOptions, cfg: ResolvedConfig): Promise<string> {
  const apiKey = cfg.openaiApiKey;
  if (!apiKey) throw new Error("OpenAI の APIキーが未設定です（管理画面のAI設定、または OPENAI_API_KEY）");
  const model = cfg.openaiModel || "gpt-4o-mini";
  const system = jsonSystem(opts);

  const messages: { role: string; content: string }[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 4096,
      messages,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error("OpenAI APIエラー: " + JSON.stringify(result).substring(0, 500));
  const text: string | undefined = result?.choices?.[0]?.message?.content;
  if (!text) throw new Error("AI応答が不正です(OpenAI): " + JSON.stringify(result).substring(0, 500));
  return text;
}

// ---- Gemini (Google Generative Language API) ----
async function callGemini(prompt: string, opts: AIOptions, cfg: ResolvedConfig): Promise<string> {
  const apiKey = cfg.geminiApiKey;
  if (!apiKey) throw new Error("Gemini の APIキーが未設定です（管理画面のAI設定、または GEMINI_API_KEY）");
  const model = cfg.geminiModel || "gemini-1.5-flash";
  const apiVersion = process.env.GEMINI_API_VERSION || "v1beta";
  const base = process.env.GEMINI_PROXY_URL || "https://generativelanguage.googleapis.com";
  const url = `${base}/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      ...(opts.json ? { generationConfig: { response_mime_type: "application/json" } } : {}),
    }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error("Gemini APIエラー: " + JSON.stringify(result).substring(0, 500));
  const text: string | undefined = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("AI応答が不正です(Gemini): " + JSON.stringify(result).substring(0, 500));
  return text;
}
