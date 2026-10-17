// @/src/components/ContactForm.tsx
// 法人・業者様向けお問い合わせフォーム（/contact）。
// ※ お客様向けのサービス問い合わせではないため、コンバージョン（generate_lead）は送信しない。
"use client";

import { useState } from "react";
import Link from "next/link";
import { CONTACT_CATEGORIES } from "@/lib/contactCategories";


const inputCls =
  "w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all text-black bg-white";
const labelCls = "block text-sm font-bold text-slate-700 mb-1";

function Req() {
  return <span className="ml-1.5 text-[11px] font-bold text-white bg-red-500 rounded px-1.5 py-0.5 align-middle">必須</span>;
}
function Opt() {
  return <span className="ml-1.5 text-[11px] font-bold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 align-middle">任意</span>;
}

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError("");

    const fd = new FormData(form);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    const data = {
      company: get("company"),
      name: get("name"),
      department: get("department"),
      email: get("email"),
      tel: get("tel"),
      category: get("category"),
      message: get("message"),
      website: get("website"), // ハニーポット（人には見えない欄）
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "送信に失敗しました");
      setSuccess(true);
      form.reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof Error && err.message && err.message !== "送信に失敗しました"
          ? err.message
          : "送信できませんでした。恐れ入りますが、時間をおいて再度お試しください。"
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white border border-slate-200 p-8 rounded-xl text-center">
        <h3 className="text-xl font-bold text-slate-800 mb-3">送信が完了いたしました</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          お問い合わせいただき、誠にありがとうございます。
          <br />
          ご入力いただいたメールアドレス宛に、受付確認メールを自動送信いたしました。
          <br />
          内容を確認のうえ、通常3営業日以内に担当者よりメールにてご連絡いたします。
        </p>
        <p className="text-xs text-slate-400 mt-4">
          ※ 受付確認メールが届かない場合は、迷惑メールフォルダをご確認ください。
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 text-sm text-slate-500 underline hover:text-slate-800"
        >
          別のお問い合わせを送る
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200"
    >
      <p className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-3">お問い合わせフォーム</p>

      <div>
        <label htmlFor="cf-company" className={labelCls}>
          会社名・団体名<Req />
        </label>
        <input id="cf-company" name="company" type="text" required maxLength={100} autoComplete="organization"
          placeholder="例：株式会社〇〇" className={inputCls} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className={labelCls}>
            ご担当者名<Req />
          </label>
          <input id="cf-name" name="name" type="text" required maxLength={50} autoComplete="name"
            placeholder="例：山田 太郎" className={inputCls} />
        </div>
        <div>
          <label htmlFor="cf-dept" className={labelCls}>
            部署名・役職<Opt />
          </label>
          <input id="cf-dept" name="department" type="text" maxLength={100} autoComplete="organization-title"
            placeholder="例：営業部 課長" className={inputCls} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-email" className={labelCls}>
            メールアドレス<Req />
          </label>
          <input id="cf-email" name="email" type="email" required maxLength={254} autoComplete="email"
            placeholder="例：info@example.co.jp" className={inputCls} />
        </div>
        <div>
          <label htmlFor="cf-tel" className={labelCls}>
            電話番号<Opt />
          </label>
          <input id="cf-tel" name="tel" type="tel" maxLength={20} autoComplete="tel"
            placeholder="例：011-123-4567" className={inputCls} />
        </div>
      </div>

      <div>
        <label htmlFor="cf-category" className={labelCls}>
          お問い合わせ種別<Req />
        </label>
        <select id="cf-category" name="category" required defaultValue="" className={inputCls}>
          <option value="" disabled>選択してください</option>
          {CONTACT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cf-message" className={labelCls}>
          お問い合わせ内容<Req />
        </label>
        <textarea id="cf-message" name="message" required rows={7} maxLength={3000}
          placeholder="ご用件・ご相談内容を具体的にご記入ください。"
          className={inputCls} />
        <p className="text-[11px] text-slate-400 mt-1">3,000文字以内</p>
      </div>

      {/* ハニーポット：人には見えない入力欄。ここに入力がある送信はボットとして破棄する */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        ご入力いただいた情報は、本お問い合わせへの回答のためにのみ使用し、
        <Link href="/privacy" className="underline hover:text-slate-800">プライバシーポリシー</Link>
        に基づき適切に管理いたします。
        <br />
        ※ 営業・ご提案を目的としたご連絡（上記記載のもの）には返信いたしかねますので、ご了承ください。
      </p>

      {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-slate-800 text-white font-bold py-4 rounded-lg hover:bg-slate-700 disabled:bg-gray-400 transition-colors"
      >
        {loading ? "送信中..." : "この内容で送信する"}
      </button>
    </form>
  );
}
