// @/src/components/ContactForm.tsx
"use client";

import { useState } from "react";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      tel: formData.get("tel"),
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("送信に失敗しました");

      setSuccess(true);
      (e.target as HTMLFormElement).reset(); // フォームを空にする
    } catch (err) {
      setError("送信できませんでした。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 p-8 rounded-lg text-center">
        <h3 className="text-xl font-bold mb-2">送信完了しました</h3>
        <p>お問い合わせありがとうございます。<br />担当者より折り返しご連絡いたします。</p>
        <button 
          onClick={() => setSuccess(false)}
          className="mt-6 text-sm text-green-600 underline hover:text-green-800"
        >
          新しい問い合わせを送る
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-slate-100">
      {/* お名前 */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">
          お名前 <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          type="text"
          required
          placeholder="例: 山田 太郎"
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black"
        />
      </div>

      {/* メールアドレス */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">
          メールアドレス <span className="text-red-500">*</span>
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder="例: info@example.com"
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black"
        />
      </div>

      {/* 電話番号 */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">
          電話番号 <span className="text-xs font-normal text-slate-500 ml-1">(任意)</span>
        </label>
        <input
          name="tel"
          type="tel"
          placeholder="例: 090-1234-5678"
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black"
        />
      </div>

      {/* 本文 */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">
          お問い合わせ内容 <span className="text-red-500">*</span>
        </label>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="ご相談内容をご記入ください..."
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black"
        />
      </div>

      {/* エラー表示 */}
      {error && (
        <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</p>
      )}

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-lg shadow-blue-200"
      >
        {loading ? "送信中..." : "この内容で送信する"}
      </button>
    </form>
  );
}