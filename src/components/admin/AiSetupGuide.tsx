// @/src/components/admin/AiSetupGuide.tsx
"use client";

import { useState } from "react";

/**
 * AIブログ生成のプロバイダ設定ガイド（ポップアップ）。
 * 各APIキーの取得先リンクと、サーバーに設定する環境変数の内容を表示する。
 */
export default function AiSetupGuide() {
  const [open, setOpen] = useState(false);

  const providers = [
    {
      name: "Claude（Anthropic）",
      color: "#0e7ad1",
      keyUrl: "https://console.anthropic.com/settings/keys",
      keyLabel: "console.anthropic.com → API Keys",
      envs: [
        "AI_PROVIDER=claude",
        "ANTHROPIC_API_KEY=sk-ant-...",
        "ANTHROPIC_MODEL=claude-sonnet-4-5  （任意）",
      ],
    },
    {
      name: "OpenAI（ChatGPT）",
      color: "#10a37f",
      keyUrl: "https://platform.openai.com/api-keys",
      keyLabel: "platform.openai.com → API keys",
      envs: [
        "AI_PROVIDER=openai",
        "OPENAI_API_KEY=sk-...",
        "OPENAI_MODEL=gpt-4o-mini  （任意）",
      ],
    },
    {
      name: "Gemini（Google）",
      color: "#e5860b",
      keyUrl: "https://aistudio.google.com/app/apikey",
      keyLabel: "Google AI Studio → APIキー",
      envs: [
        "AI_PROVIDER=gemini",
        "GEMINI_API_KEY=...",
        "GEMINI_MODEL_NAME=gemini-1.5-flash  （任意）",
      ],
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg"
      >
        🤖 AI設定ガイド
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8 p-6 md:p-8">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-black text-slate-800">AIブログ：プロバイダ設定ガイド</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              AIブログ生成・サービスページ生成・SEO提案・ビフォーアフター生成で使うAIは、
              サーバーの環境変数 <code className="bg-slate-100 px-1 rounded">AI_PROVIDER</code> で切り替えます。
              使いたいサービスのAPIキーを取得して、下記の環境変数を設定してください。
              <br />
              <span className="text-xs text-slate-400">
                ※各社のAPIは従量課金です。Claude.ai等の月額サブスクとは別会計になります。
              </span>
            </p>

            <div className="space-y-4">
              {providers.map((p) => (
                <div key={p.name} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="font-black text-slate-800" style={{ color: p.color }}>
                      {p.name}
                    </h3>
                    <a
                      href={p.keyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-white px-3 py-1.5 rounded-full whitespace-nowrap"
                      style={{ background: p.color }}
                    >
                      APIキーを取得 →
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">{p.keyLabel}</p>
                  <pre className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[12px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {p.envs.join("\n")}
                  </pre>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500 mt-5 leading-relaxed">
              設定後、サーバー（ConoHa等）の環境変数に反映し、アプリを再起動してください。
              未設定のプロバイダに切り替えるとエラーになります（キーが必須です）。
            </p>
          </div>
        </div>
      )}
    </>
  );
}
