// @/src/app/lp/thank-you/page.tsx
import type { Metadata } from "next";
import ConversionTracker from "@/components/ConversionTracker";

export const metadata: Metadata = {
  title: "お問い合わせありがとうございます",
  robots: { index: false, follow: false },
};

export default function LpThankYouPage() {
  return (
    <main className="min-h-[70vh] bg-gradient-to-b from-sky-50 to-white flex items-center justify-center px-4 text-slate-800">
      {/* GA4 generate_lead を発火（→GA4でキーイベント化→広告にインポートでCV計測） */}
      <ConversionTracker formType="lp" />

      <div className="w-full max-w-lg text-center">
        <div className="bg-white rounded-3xl shadow-xl p-10 border border-slate-200">
          <p className="text-6xl mb-6">🎉</p>
          <h1 className="text-2xl md:text-3xl font-black mb-4">
            お問い合わせありがとうございます
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            内容を確認のうえ、担当者より折り返しご連絡いたします。
            <br />
            少々お待ちくださいませ。
          </p>
          <div className="bg-sky-50 rounded-xl p-4 mb-6 border border-sky-200">
            <p className="text-xs text-slate-500 font-bold mb-1">
              お急ぎの場合はお電話ください
            </p>
            <a
              href="tel:0120-792-684"
              className="text-2xl font-black text-sky-700 tracking-widest font-mono"
            >
              0120-792-684
            </a>
            <p className="text-[10px] text-slate-400 mt-1">受付時間 9:00〜18:00</p>
          </div>
          <a
            href="/"
            className="inline-block bg-slate-800 text-white font-bold py-3 px-8 rounded-full hover:bg-slate-700 transition-colors"
          >
            公式サイトへ
          </a>
        </div>
      </div>
    </main>
  );
}
