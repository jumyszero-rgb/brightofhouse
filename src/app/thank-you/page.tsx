// @/src/app/thank-you/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お申し込みありがとうございます | 北海道ブライトオブハウス",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center px-4 text-black">
      <div className="w-full max-w-lg text-center">
        <div className="bg-white rounded-3xl shadow-xl p-10 border border-slate-200">
          <p className="text-6xl mb-6">🎉</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-4">
            お申し込みありがとうございます
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            仮予約・お問い合わせを受け付けました。<br />
            担当者より確認のご連絡をいたしますので、<br />
            少々お待ちくださいませ。
          </p>
          <div className="bg-sky-50 rounded-xl p-4 mb-6 border border-sky-200">
            <p className="text-xs text-slate-500 font-bold mb-1">お急ぎの場合はお電話ください</p>
            <a href="tel:0120792684" className="text-2xl font-black text-sky-700 tracking-widest font-mono">
              0120-792-684
            </a>
            <p className="text-[10px] text-slate-400 mt-1">受付時間 9:00〜18:00</p>
          </div>
          <a
            href="/"
            className="inline-block bg-slate-800 text-white font-bold py-3 px-8 rounded-full hover:bg-slate-700 transition-colors"
          >
            トップページへ戻る
          </a>
        </div>
      </div>
    </main>
  );
}

