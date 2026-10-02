// @/src/app/admin/ai-settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Provider = "claude" | "openai" | "gemini";

const PROVIDER_META: Record<
  Provider,
  { label: string; color: string; keyUrl: string; keyLabel: string; modelPh: string }
> = {
  claude: {
    label: "Claude（Anthropic）",
    color: "#0e7ad1",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyLabel: "console.anthropic.com → API Keys",
    modelPh: "claude-sonnet-4-5（空欄で既定）",
  },
  openai: {
    label: "OpenAI（ChatGPT）",
    color: "#10a37f",
    keyUrl: "https://platform.openai.com/api-keys",
    keyLabel: "platform.openai.com → API keys",
    modelPh: "gpt-4o-mini（空欄で既定）",
  },
  gemini: {
    label: "Gemini（Google）",
    color: "#e5860b",
    keyUrl: "https://aistudio.google.com/app/apikey",
    keyLabel: "Google AI Studio → APIキー",
    modelPh: "gemini-1.5-flash（空欄で既定）",
  },
};

export default function AdminAiSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [provider, setProvider] = useState<Provider>("claude");
  const [models, setModels] = useState({ anthropicModel: "", openaiModel: "", geminiModel: "" });
  const [keys, setKeys] = useState({ anthropicApiKey: "", openaiApiKey: "", geminiApiKey: "" });
  const [hasKey, setHasKey] = useState({ anthropic: false, openai: false, gemini: false });

  useEffect(() => {
    fetch("/api/ai-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d?.provider) setProvider(d.provider);
        setModels({
          anthropicModel: d.anthropicModel || "",
          openaiModel: d.openaiModel || "",
          geminiModel: d.geminiModel || "",
        });
        setHasKey({
          anthropic: !!d.hasAnthropicKey,
          openai: !!d.hasOpenaiKey,
          gemini: !!d.hasGeminiKey,
        });
      })
      .catch(() => {});
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, ...models, ...keys }),
      });
      if (!res.ok) throw new Error();
      setMessage("✅ 保存しました");
      setKeys({ anthropicApiKey: "", openaiApiKey: "", geminiApiKey: "" });
      // 保存後の状態を再取得
      const d = await (await fetch("/api/ai-settings")).json();
      setHasKey({
        anthropic: !!d.hasAnthropicKey,
        openai: !!d.hasOpenaiKey,
        gemini: !!d.hasGeminiKey,
      });
    } catch {
      setMessage("❌ 保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const providerKeys: { p: Provider; keyField: keyof typeof keys; modelField: keyof typeof models; has: boolean }[] = [
    { p: "claude", keyField: "anthropicApiKey", modelField: "anthropicModel", has: hasKey.anthropic },
    { p: "openai", keyField: "openaiApiKey", modelField: "openaiModel", has: hasKey.openai },
    { p: "gemini", keyField: "geminiApiKey", modelField: "geminiModel", has: hasKey.gemini },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">AI設定（ブログ生成などで使用）</h1>
          <Link href="/admin" className="text-sm text-gray-500 hover:underline">← 戻る</Link>
        </div>

        <form onSubmit={save} className="space-y-6">
          {/* 使用するAIを選択 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <label className="block text-sm font-bold text-gray-700 mb-2">使用するAI</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PROVIDER_META) as Provider[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                    provider === p ? "text-white" : "bg-white text-gray-600 border-gray-300"
                  }`}
                  style={provider === p ? { background: PROVIDER_META[p].color, borderColor: PROVIDER_META[p].color } : {}}
                >
                  {PROVIDER_META[p].label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              現在の選択：<b style={{ color: PROVIDER_META[provider].color }}>{PROVIDER_META[provider].label}</b>
            </p>
          </div>

          {/* 各プロバイダのキー・モデル */}
          {providerKeys.map(({ p, keyField, modelField, has }) => {
            const meta = PROVIDER_META[p];
            return (
              <div
                key={p}
                className={`border rounded-lg p-4 ${provider === p ? "border-2" : "border-gray-200 opacity-80"}`}
                style={provider === p ? { borderColor: meta.color } : {}}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="font-bold" style={{ color: meta.color }}>
                    {meta.label}
                    {provider === p && <span className="ml-2 text-[11px] text-white px-2 py-0.5 rounded-full" style={{ background: meta.color }}>使用中</span>}
                  </h2>
                  <a href={meta.keyUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold whitespace-nowrap hover:underline" style={{ color: meta.color }}>
                    APIキーを取得 →
                  </a>
                </div>
                <p className="text-[11px] text-gray-400 mb-2">{meta.keyLabel}</p>

                <label className="block text-xs font-bold text-gray-500 mb-1">
                  APIキー {has && <span className="text-green-600">（設定済み）</span>}
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={keys[keyField]}
                  onChange={(e) => setKeys({ ...keys, [keyField]: e.target.value })}
                  placeholder={has ? "設定済み（変更する場合のみ入力）" : "APIキーを貼り付け"}
                  className="w-full p-2 border rounded text-black text-sm mb-3"
                />

                <label className="block text-xs font-bold text-gray-500 mb-1">モデル（任意）</label>
                <input
                  type="text"
                  value={models[modelField]}
                  onChange={(e) => setModels({ ...models, [modelField]: e.target.value })}
                  placeholder={meta.modelPh}
                  className="w-full p-2 border rounded text-black text-sm"
                />
              </div>
            );
          })}

          <p className="text-xs text-gray-500 leading-relaxed">
            ※APIキーは安全のため画面には再表示されません（設定済みかどうかのみ表示）。空欄で保存すると既存のキーは維持されます。
            <br />
            ※各社のAPIは従量課金です（Claude.ai等のサブスクとは別会計）。
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-bold"
          >
            {loading ? "保存中..." : "設定を保存"}
          </button>
          {message && <p className="text-center font-bold text-green-600">{message}</p>}
        </form>
      </div>
    </div>
  );
}
