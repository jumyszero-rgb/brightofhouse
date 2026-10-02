// @/src/app/contact/page.tsx
import ContactForm from "@/components/ContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description:
    "札幌の水回りクリーニング・ハウスクリーニングのお見積り・ご相談はこちらから。通常24時間以内に担当者よりご連絡いたします。",
  alternates: { canonical: "/contact" },
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



        {/* 営業・勧誘目的のお問い合わせお断り */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 mb-8">
          <p className="text-sm font-bold text-slate-700 mb-3">
            営業・ご提案目的のお問い合わせについて
          </p>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-3">
            平素より格別のご高配を賜り、誠にありがとうございます。
            大変恐れ入りますが、当社では現在、下記に関する営業・ご提案・勧誘を目的としたご連絡はお受けしておりません。
            あらかじめご了承くださいますようお願い申し上げます。
          </p>
          <ul className="text-xs sm:text-sm text-slate-500 leading-relaxed space-y-1.5 pl-4 list-disc marker:text-slate-300">
            <li>
              SEO・MEO・AIO対策、Web集客・広告運用（AIを活用した広告、SNS広告などを含む）に関するご提案
            </li>
            <li>ホームページ制作、Webアプリ・システム開発に関するご提案</li>
            <li>
              マッチングサイト・ビジネスマッチング・各種プラットフォームサービスへのご登録・ご参加のお誘い
            </li>
          </ul>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-3">
            上記に該当するご連絡につきましては、恐縮ながら返信を控えさせていただく場合がございます。
            何卒ご理解を賜りますようお願い申し上げます。
          </p>
        </div>

        <ContactForm />

      </div>
    </main>
  );
}