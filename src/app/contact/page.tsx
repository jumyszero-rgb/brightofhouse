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
        <ContactForm />
        
      </div>
    </main>
  );
}