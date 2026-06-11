// @/src/components/lp/LeadForm.tsx
"use client";

import { useState } from "react";
import { BRAND } from "@/lib/lpContent";

const TIMING_OPTIONS = [
  "なるべく早く",
  "1週間以内",
  "今月中",
  "時期は相談したい",
];

// 連絡方法（複数選択可）
const CONTACT_OPTIONS = ["電話", "SMS", "メール", "LINE"];

/**
 * LP用の軽量リードフォーム。カレンダー・料金計算なし。
 * service は各LPからプリセット。送信後 /lp/thank-you に遷移し generate_lead 発火。
 */
export default function LeadForm({
  service,
  source,
}: {
  service: string;
  source: string;
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    zip: "",
    address: "",
    email: "",
    timing: TIMING_OPTIONS[0],
    notes: "",
  });
  const [contactMethods, setContactMethods] = useState<string[]>(["電話"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // 郵便番号から住所を自動補完（zipcloud）
  const handleZipSearch = async (zip: string) => {
    update("zip", zip);
    if (zip.length === 7) {
      try {
        const res = await fetch(
          `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`
        );
        const data = await res.json();
        if (data.results) {
          const { address1, address2, address3 } = data.results[0];
          setForm((prev) => ({
            ...prev,
            address: `${address1}${address2}${address3}`,
          }));
        }
      } catch {
        /* 補完失敗時は手入力に任せる */
      }
    }
  };
  const toggleContact = (m: string) =>
    setContactMethods((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  const lineSelected = contactMethods.includes("LINE");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.phone.trim()) {
      setError("お名前と電話番号をご入力ください。");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          contactMethod: contactMethods.join("・"),
          service,
          source,
        }),
      });
      if (!res.ok) throw new Error();
      window.location.href = "/lp/thank-you";
    } catch {
      setError("送信に失敗しました。お手数ですがお電話ください（0120-792-684）。");
      setLoading(false);
    }
  };

  return (
    <div
      id="lead"
      className="bg-white rounded-3xl shadow-xl border border-blue-100 overflow-hidden scroll-mt-20"
    >
      <div className="bg-blue-600 p-5 text-white text-center">
        <h3 className="text-lg font-bold">かんたん無料相談・お見積り</h3>
        <p className="text-blue-100 text-xs mt-1">
          30秒で送信。担当者より折り返しご連絡します。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 md:p-7 space-y-4 text-slate-800">
        {/* LINEで相談（BRAND.lineUrl 設定時のみ表示） */}
        {BRAND.lineUrl && (
          <a
            href={BRAND.lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition-colors"
          >
            <span aria-hidden>💬</span> LINEで相談する（友だち追加）
          </a>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
          <span className="text-slate-500">ご相談内容：</span>
          <span className="font-bold text-blue-700 ml-1">{service}</span>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">
            お名前 <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl"
            placeholder="例：山田 太郎"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">
            電話番号 <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl"
            placeholder="例：090-1234-5678"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">
            郵便番号 <span className="text-red-500">*</span>
          </label>
          <input
            required
            inputMode="numeric"
            value={form.zip}
            onChange={(e) => handleZipSearch(e.target.value.replace(/[^0-9]/g, ""))}
            maxLength={7}
            className="w-full p-3 border border-slate-300 rounded-xl"
            placeholder="例：0600000（ハイフンなし7桁）"
          />
          <p className="text-[11px] text-slate-400 mt-1">入力すると住所が自動で入ります（対応エリア確認のため）。</p>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">
            住所（任意・番地・建物名まで追記できます）
          </label>
          <input
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl"
            placeholder="郵便番号から自動入力。番地・建物・部屋番号を追記いただけます"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">
            メールアドレス（任意）
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl"
            placeholder="例：example@mail.com"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">ご希望の時期</label>
          <select
            value={form.timing}
            onChange={(e) => update("timing", e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl bg-white"
          >
            {TIMING_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">
            ご連絡方法（複数選択OK）
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTACT_OPTIONS.map((m) => {
              const on = contactMethods.includes(m);
              return (
                <label
                  key={m}
                  className={`px-4 py-2 rounded-full border cursor-pointer text-sm transition-all ${
                    on
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleContact(m)}
                    className="hidden"
                  />
                  {on ? "✓ " : ""}
                  {m}
                </label>
              );
            })}
          </div>
          {lineSelected && BRAND.lineUrl && (
            <p className="text-xs text-green-700 mt-2 font-bold">
              ※LINEご希望の方は、上の緑のボタンから友だち追加をお願いします。
            </p>
          )}
          {lineSelected && !BRAND.lineUrl && (
            <p className="text-xs text-slate-500 mt-2">
              ※LINEのご案内は折り返しお送りします。
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">
            ご要望・気になる点（任意）
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={3}
            className="w-full p-3 border border-slate-300 rounded-xl"
            placeholder="汚れの状態や広さ、ご質問などお気軽にどうぞ"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 font-bold bg-red-50 rounded-lg p-3 text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-300 transition-all text-lg"
        >
          {loading ? "送信中..." : "無料で相談・見積りを依頼する"}
        </button>
        <p className="text-center text-[11px] text-slate-400">
          送信いただくと
          <a href="/privacy" className="underline">
            プライバシーポリシー
          </a>
          に同意したものとみなします。
        </p>
      </form>
    </div>
  );
}
