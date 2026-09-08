// @/src/app/thank-you/page.tsx
import type { Metadata } from "next";
import ConversionTracker from "@/components/ConversionTracker";

export const metadata: Metadata = {
  title: "お申し込みありがとうございます | 北海道ブライトオブハウス",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center px-4 text-black">
      {/* ★追加：既存の予約・問い合わせフォーム送信を generate_lead として計測 */}
      <ConversionTracker formType="booking" />

      <div className="w-full max-w-lg text-center">
        <div className="bg-white rounded-3xl shadow-xl p-10 border border-slate-200">
          <p className="text-6xl mb-6">🎉</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-4">
            お申し込みありがとうございます
          </h1>
          <p className="text-base font-bold text-slate-800 leading-relaxed mb-4">
            仮予約の申し込みを完了いたしました。<br />
            担当者よりご指定の方法で連絡があります。
          </p>
          <div className="text-left text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 space-y-2">
            <p className="font-bold text-slate-700">仮予約 → 担当者より返信またはお電話 → 確定 になります。</p>
            <p>※お電話以外のやり取りに関しましては、返信にご回答いただいて申込完了となります。</p>
            <p className="text-red-600 font-bold">※現段階は仮予約です。作業前日までに最終的なご返信がない場合は無効となりますのでご注意をお願いします。</p>
          </div>
          <div className="bg-sky-50 rounded-xl p-4 mb-6 border border-sky-200">
            <p className="text-xs text-slate-500 font-bold mb-1">お急ぎの場合は お電話ください</p>
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
