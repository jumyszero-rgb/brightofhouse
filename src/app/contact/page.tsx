// @/src/app/contact/page.tsx
import ContactForm from "@/components/ContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お問い合わせ | 北海道ブライトオブハウス",
  description: "清掃のご依頼、お見積り相談はこちらから。",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-20 px-4 sm:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">
            お問い合わせ
            <span className="block text-lg font-normal text-slate-500 mt-2">
              Contact Us
            </span>
          </h1>
          <p className="text-slate-600">
            お見積りやご相談など、お気軽にお問い合わせください。<br />
            通常24時間以内に担当者よりご連絡いたします。
          </p>
        </div>

        {/* ここに部品を置くだけ！ */}
        
        {/* LINE案内 */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4 mb-8">
          <img src="/images/line-qr.JPG" alt="LINE QRコード" className="w-20 h-20 rounded-lg border" />
          <div>
            <p className="font-bold text-green-700 text-sm">LINEでもお問い合わせ可能です</p>
            <p className="text-xs text-slate-600 mt-1">スマホでQRコードを読み取ってお気軽にご相談ください。</p>
          </div>
        </div>



        <ContactForm />
        
      </div>
    </main>
  );
}