// @/src/app/privacy/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description:
    "北海道ブライトオブハウス（合同会社むすびえむ）のプライバシーポリシー（個人情報保護方針）です。",
  alternates: { canonical: "/privacy" },
};

// ※法務確認のうえご利用ください。一般的な雛形です。
export default function PrivacyPage() {
  const updated = "2026年6月";
  return (
    <div className="bg-white min-h-screen">
      <main className="max-w-3xl mx-auto px-5 py-12 text-slate-800">
      <h1 className="text-2xl md:text-3xl font-black mb-2">プライバシーポリシー</h1>
      <p className="text-sm text-slate-500 mb-8">最終更新：{updated}</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <p>
          北海道ブライトオブハウス（運営：合同会社むすびえむ。以下「当社」）は、
          お客様の個人情報を適切に取り扱うため、以下のとおりプライバシーポリシーを定めます。
        </p>

        <section>
          <h2 className="text-lg font-bold mb-2">1. 取得する情報</h2>
          <p>
            当社は、お問い合わせ・お見積り・ご予約の際に、お名前、電話番号、メールアドレス、
            ご住所、ご相談内容等の情報を取得することがあります。また、ウェブサイトの利用状況を把握するため、
            Cookie等を通じてアクセス情報を取得する場合があります。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">2. 利用目的</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>お問い合わせ・お見積り・ご予約への対応のため</li>
            <li>サービスの提供・連絡・確認のため</li>
            <li>サービス向上およびウェブサイト改善のための分析のため</li>
            <li>法令に基づく対応のため</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">3. 第三者への提供</h2>
          <p>
            当社は、法令に基づく場合等を除き、ご本人の同意なく個人情報を第三者に提供しません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">4. アクセス解析・広告について</h2>
          <p>
            当ウェブサイトでは、利用状況の把握のため Google アナリティクスを、
            また広告効果測定のため Google 広告のコンバージョン測定機能を利用しています。
            これらは Cookie を使用し、個人を特定しない形でデータを収集します。
            ブラウザの設定により Cookie の利用を無効にすることができます。
            データの取り扱いについては Google のプライバシーポリシーをご確認ください。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">5. 個人情報の管理</h2>
          <p>
            当社は、取得した個人情報を適切に管理し、漏えい・滅失・毀損の防止に努めます。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">6. 開示・訂正・削除</h2>
          <p>
            ご本人からの個人情報の開示・訂正・削除等のご請求があった場合は、
            ご本人であることを確認のうえ、合理的な範囲で速やかに対応します。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">7. お問い合わせ窓口</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <p className="font-bold">北海道ブライトオブハウス（合同会社むすびえむ）</p>
            <p>
              所在地：〒003-0005 北海道札幌市白石区東札幌五条二丁目6番10
              ビッグバーンズマンション東札幌2-105号
            </p>
            <p>
              電話：
              <a href="tel:0120-792-684" className="text-blue-700 font-bold">
                0120-792-684
              </a>
              （9:00〜18:00）
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">8. 本ポリシーの変更</h2>
          <p>
            当社は、必要に応じて本ポリシーを変更することがあります。変更後の内容は本ページに掲載した時点で効力を生じます。
          </p>
        </section>
      </div>
      </main>
    </div>
  );
}
