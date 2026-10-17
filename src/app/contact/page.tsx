// @/src/app/contact/page.tsx
// 法人・業者様向けのお問い合わせ窓口（お客様向けは /inquiry）。
// ※ コンバージョン（generate_lead）には数えない。
import ContactForm from "@/components/ContactForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "法人・業者様のお問い合わせ",
  description:
    "北海道ブライトオブハウス（合同会社むすびえむ）への法人・業者様からのお問い合わせ窓口です。お取引・業務提携等のご相談は本フォームより承ります。",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-16 sm:py-20 px-4 sm:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">
            法人・業者様のお問い合わせ
            <span className="block text-lg font-normal text-slate-500 mt-2">Business Inquiry</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            本ページは、法人・事業者の皆様からのお問い合わせ専用窓口です。
            <br className="hidden sm:block" />
            お取引・業務提携等のご相談は、下記フォームよりご連絡ください。
          </p>
        </div>

        {/* 個人のお客様はこちら（サービスのお問い合わせへ誘導） */}
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 sm:p-5 mb-8 text-sm text-slate-700 leading-relaxed">
          <p className="font-bold text-sky-800 mb-1">個人のお客様へ</p>
          <p>
            清掃サービスのご相談・お見積りは、
            <Link href="/inquiry" className="text-sky-700 font-bold underline underline-offset-2 hover:text-sky-900">
              サービスのお問い合わせ
            </Link>
            よりお願いいたします。
          </p>
        </div>

        {/* ご連絡方法（原則メール） */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 mb-8">
          <p className="text-sm font-bold text-slate-700 mb-3">ご連絡方法について</p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            法人・業者様からのご連絡は、<span className="font-bold">原則として本フォーム（メール）にて承っております。</span>
            内容を確認のうえ、担当者よりメールにてご返信いたします。
            業務の都合上、お電話でのお問い合わせには対応いたしかねる場合がございますので、あらかじめご了承ください。
          </p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-600">
            <dt className="text-slate-400">会社名</dt>
            <dd>合同会社むすびえむ（北海道ブライトオブハウス）</dd>
            <dt className="text-slate-400">電話</dt>
            <dd>
              0120-792-684
              <span className="block text-[11px] text-slate-400">※基本はメール（本フォーム）にてご連絡ください。</span>
            </dd>
            <dt className="text-slate-400">返信</dt>
            <dd>通常3営業日以内（内容により返信を控えさせていただく場合がございます）</dd>
          </dl>
        </div>

        {/* 営業・勧誘目的のお問い合わせお断り */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 mb-8">
          <p className="text-sm font-bold text-slate-700 mb-3">営業・ご提案目的のお問い合わせについて</p>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-3">
            平素より格別のご高配を賜り、誠にありがとうございます。
            大変恐れ入りますが、当社では現在、下記に関する営業・ご提案・勧誘を目的としたご連絡はお受けしておりません。
            あらかじめご了承くださいますようお願い申し上げます。
          </p>
          <ul className="text-xs sm:text-sm text-slate-500 leading-relaxed space-y-1.5 pl-4 list-disc marker:text-slate-300">
            <li>SEO・MEO・AIO対策、Web集客・広告運用（AIを活用した広告、SNS広告などを含む）に関するご提案</li>
            <li>ホームページ制作、Webアプリ・システム開発に関するご提案</li>
            <li>マッチングサイト・ビジネスマッチング・各種プラットフォームサービスへのご登録・ご参加のお誘い</li>
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
