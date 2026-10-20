// @/src/app/inquiry/page.tsx
// お客様向けのお問い合わせ・無料見積りページ。
// フォームは広告LPと同じ LeadForm（送信後 /lp/thank-you で generate_lead を計測、通知メールに【流入元】付き）。
// ※ /contact は業者・法人向けとして残す（コンバージョンには数えない）。
// ※ フォームの項目は今後この LeadForm を差し替え／拡張する予定。
import type { Metadata } from "next";
import LeadForm from "@/components/lp/LeadForm";
import PhoneLink from "@/components/PhoneLink";
import Link from "next/link";

export const metadata: Metadata = {
  title: "サービスのお問い合わせ・無料お見積り",
  description:
    "北海道ブライトオブハウスへの無料相談・お見積りのお申し込みはこちら。写真を送っていただくとお見積りがスムーズです。",
  robots: { index: false, follow: true },
  alternates: { canonical: "/inquiry" },
};

export default function InquiryPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white px-4 py-10 md:py-14 text-slate-800">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-black text-center mb-3">サービスのお問い合わせ・無料お見積り</h1>
        <p className="text-center text-sm text-slate-600 leading-relaxed mb-6">
          ご相談・お見積りは無料です。担当者より折り返しご連絡いたします。
          <br className="hidden sm:block" />
          お急ぎの方はお電話でもどうぞ。
        </p>
        <div className="text-center mb-8">
          <PhoneLink
            className="inline-flex items-center gap-2 bg-white border border-sky-200 text-sky-700 font-black text-xl px-6 py-3 rounded-full shadow-sm"
            prefix={<span aria-hidden>📞</span>}
          />
          <p className="text-[11px] text-slate-400 mt-1">受付 9:00〜18:00</p>
        </div>

        {/* 固定バーの「無料で相談」の飛び先 */}
        <div id="lead">
          <LeadForm service="お問い合わせ・お見積り（ホームページ）" source="hp/inquiry" />
        </div>

        {/* 業者・営業の方を業者用窓口へ誘導（このフォームはお客様専用） */}
        <p className="mt-8 text-xs text-slate-500 leading-relaxed text-center">
          ※ こちらはお客様向けの、清掃サービスに関するお問い合わせ窓口です。
          <br className="hidden sm:block" />
          法人・業者様からのご連絡（お取引のご相談・ご提案など）は、
          <Link href="/contact" className="text-sky-700 underline underline-offset-2 hover:text-sky-900">
            法人・業者様のお問い合わせ
          </Link>
          よりお願いいたします。
        </p>
      </div>
    </main>
  );
}
