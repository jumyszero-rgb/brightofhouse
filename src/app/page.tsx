// @/src/app/page.tsx
import prisma from "@/lib/prisma";
import { cheapestBookingMenu } from "@/lib/bookingMenuToBookingData";
import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";
import AfterImageMarquee from "@/components/AfterImageMarquee";
import PromotionVideoGallery from "@/components/PromotionVideoGallery";
import TopPriceSection from "@/components/TopPriceSection";
import ServiceArea from "@/components/ServiceArea";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ★ 追加: トップページ専用のmetadata
export const metadata: Metadata = {
  title:
    "札幌の水回りクリーニング・ハウスクリーニング｜北海道ブライトオブハウス",
  description:
    "札幌市の水回りクリーニング・ハウスクリーニング専門店。キッチン・浴室・トイレ・換気扇の清掃、排水管高圧洗浄、ゴミ屋敷片付けまで対応。口コミ★4.9、明朗価格。お見積り無料。",
  alternates: {
    canonical: "/",
  },
};

// ★ 追加: FAQデータ（トップページ用）
const topFaqs = [
  {
    question: "水回りクリーニングの作業時間はどのくらいですか？",
    answer:
      "水回り5点セット（キッチン・浴室・トイレ・洗面所・換気扇）で約3〜5時間が目安です。汚れの状態によって前後しますが、事前にお伝えいたします。",
  },
  {
    question: "見積りは本当に無料ですか？",
    answer:
      "はい、完全無料です。写真をお送りいただくだけで概算のお見積りが可能です。現地見積りも無料で、見積り後にお断りいただいても費用は一切かかりません。",
  },
  {
    question: "札幌市以外のエリアにも対応していますか？",
    answer:
      "はい。札幌市全10区に加え、江別市・北広島市・恵庭市・千歳市・石狩市・小樽市・当別町・苫小牧市など、事務所から約25km圏内に対応しています。ゴミ屋敷清掃・遺品整理は北海道全域対応です。",
  },
  {
    question: "作業中は家にいる必要がありますか？",
    answer:
      "作業開始時と完了時のお立ち会いをお願いしておりますが、作業中は外出いただいても構いません。鍵をお預かりしての作業も可能です。",
  },
  {
    question: "急ぎの依頼にも対応できますか？",
    answer:
      "空き状況によりますが、できる限り柔軟に対応いたします。お急ぎの場合はまずお電話（0120-792-684）でご相談ください。",
  },
];

export default async function Home() {
  const settings = await prisma.heroSettings.findUnique({
    where: { id: "main" },
  });
  const videos = await prisma.promotionVideo.findMany({
    orderBy: { createdAt: "desc" },
  });
  const beforeAfterItems = await prisma.beforeAfter.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { afterUrl: true },
  });
  const afterImages = beforeAfterItems.map((item) => item.afterUrl);
  const featuredLPs = await prisma.landingPage.findMany({
    where: { status: "PUBLISHED", showOnHome: true, category: "CAMPAIGN" },
    orderBy: { updatedAt: "desc" },
    take: 3,
  });
  const regionalLPs = await prisma.landingPage.findMany({
    where: { status: "PUBLISHED", category: "AREA" },
    orderBy: { title: "asc" },
  });
  const latestPosts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  // ★ 追加: サービスカテゴリを取得（サービスリンクセクション用）
  const servicePages = await prisma.servicePage.findMany({
    where: { status: "PUBLISHED", noIndex: false, showOnHome: true },
    select: {
      slug: true, title: true, catchphrase: true, cardIcon: true,
      bookingMenus: { select: { basePrice: true, priceNote: true, discountPercent: true, discountRounding: true } },
      bookingCategories: { select: { menus: { select: { basePrice: true, priceNote: true, discountPercent: true, discountRounding: true } } } },
    },
    orderBy: { createdAt: "asc" },
    take: 12,
  });

  // --- 構造化データ ---
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "北海道ブライトオブハウス",
    image: "https://brightofhouse.jp/images/logo.png",
    url: "https://brightofhouse.jp",
    telephone: "0120-792-684",
    address: {
      "@type": "PostalAddress",
      streetAddress:
        "東札幌五条二丁目6番10 ビッグバーンズマンション東札幌2-105号",
      addressLocality: "札幌市白石区",
      addressRegion: "北海道",
      postalCode: "003-0005",
      addressCountry: "JP",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 43.061,
      longitude: 141.385,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "200",
      bestRating: "5",
    },
  };

  // ★ 追加: FAQ構造化データ
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: topFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const defaultSettings = {
    title: "北海道ブライトオブハウス",
    subtitle: "水回りクリーニング / ハウスクリーニング / ゴミ屋敷清掃",
    mobileHeight: "h-[50vh]",
    pcHeight: "md:h-[65vh]",
    btn1Text: "仮予約・お見積り・ご相談",
    btn1Link: "/service",
    btn2Text: "料金を見る",
    btn2Link: "/service",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <HomeClient settings={settings || defaultSettings}>
        {/* 2. 選ばれる3つの理由 */}
        <section className="bg-white py-16 px-4 border-b border-slate-100 text-black">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800">
                北海道ブライトオブハウスが選ばれる理由
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                安さ・実績・品質で、札幌のお客様に選ばれ続けています
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100 text-center">
                <div className="text-5xl mb-4">💰</div>
                <h3 className="text-xl font-black text-blue-700 mb-3">
                  札幌最安水準の価格
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  大手より圧倒的に安い価格設定。「安かろう悪かろう」ではありません。低価格でもプロの仕上がりをお約束します。
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-white p-8 rounded-2xl border border-amber-100 text-center">
                <div className="text-5xl mb-4">⭐</div>
                <h3 className="text-xl font-black text-amber-700 mb-3">
                  口コミ★4.9（200件超）
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  大手口コミサイトで200件を超えるレビュー、総合評価★4.9。多くのお客様にご満足いただいている実績があります。
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-white p-8 rounded-2xl border border-emerald-100 text-center">
                <div className="text-5xl mb-4">✨</div>
                <h3 className="text-xl font-black text-emerald-700 mb-3">
                  プロの技術で安心品質
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  専用機材とプロ用洗剤を使い、市販品では落ちない頑固な汚れも徹底除去。仕上がりに自信があります。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 人気メニュー・料金 */}
        <TopPriceSection />

        {/* ★ 追加: サービス一覧リンク（内部リンク網の強化） */}
        {servicePages.length > 0 && (
          <section className="bg-white py-16 px-4 border-b border-slate-100 text-black">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-black text-slate-800">
                  サービス一覧
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  各サービスの詳細・料金はこちらからご確認いただけます
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {servicePages.map((sp) => {
                  const cheapest = cheapestBookingMenu([...sp.bookingMenus, ...sp.bookingCategories.flatMap((c) => c.menus)]);
                  return (
                  <Link
                    key={sp.slug}
                    href={`/service/${sp.slug}`}
                    className="group bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl p-4 md:p-5 transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xl md:text-2xl leading-none flex-shrink-0" aria-hidden>
                        {sp.cardIcon || "🧹"}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 group-hover:text-blue-600 text-sm md:text-base leading-snug transition-colors">
                          {sp.title}
                        </h3>
                        {sp.catchphrase && (
                          <p className="text-[10px] md:text-xs text-slate-400 mt-1 line-clamp-2">
                            {sp.catchphrase}
                          </p>
                        )}
                        {cheapest && (
                          <p className="text-[10px] md:text-xs font-bold text-blue-600 mt-1">
                            {cheapest.priceNote && <span className="mr-0.5">{cheapest.priceNote}</span>}
                            {cheapest.discountPercent ? (
                              <>
                                <span className="text-slate-400 line-through mr-1">¥{cheapest.basePrice.toLocaleString()}</span>
                                <span className="text-red-600">¥{cheapest.effectivePrice.toLocaleString()}〜</span>
                              </>
                            ) : (
                              <>¥{cheapest.basePrice.toLocaleString()}〜</>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
              <div className="text-center mt-6">
                <Link
                  href="/service"
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  サービス・料金表の一覧を見る →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 4. ビフォーアフター */}
        {afterImages.length > 0 && <AfterImageMarquee images={afterImages} />}

        {/* プロモーション動画 */}
        <PromotionVideoGallery videos={videos} />

        {/* 5. 口コミ実績バナー */}
        <section className="bg-gradient-to-r from-slate-800 to-slate-900 py-12 px-4 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-yellow-400 text-3xl">★★★★★</span>
            </div>
            <p className="text-4xl md:text-5xl font-black mb-2">
              4.9
              <span className="text-lg font-normal text-slate-300 ml-2">
                / 5.0
              </span>
            </p>
            <p className="text-slate-300 text-sm mb-6">
              大手口コミサイトでの総合評価（200件超の実績）
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://www.google.com/maps/place/北海道ブライトオブハウス"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-slate-800 px-6 py-3 rounded-full font-bold text-sm hover:bg-slate-100 transition-colors inline-flex items-center gap-2"
              >
                <span>📍</span> Googleクチコミを見る
              </a>
              <Link
                href="/before-after"
                className="bg-white/10 border border-white/30 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-white/20 transition-colors inline-flex items-center gap-2"
              >
                <span>✨</span> ビフォーアフターを見る
              </Link>
            </div>
          </div>
        </section>

        {/* 6. キャンペーン情報 */}
        {featuredLPs.length > 0 && (
          <section className="bg-white py-10 px-4 border-b border-slate-100 text-black">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                  HOT
                </span>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  キャンペーン情報
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredLPs.map((lp) => (
                  <Link
                    key={lp.id}
                    href={`/lp/${lp.slug}`}
                    className="group relative flex flex-col justify-center bg-gradient-to-br from-red-500 to-orange-500 p-5 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all overflow-hidden text-white"
                  >
                    <div className="relative z-10">
                      <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full mb-2 inline-block uppercase">
                        Campaign
                      </span>
                      <h3 className="font-black text-lg leading-tight mb-1 group-hover:underline">
                        {lp.linkTitle || lp.title}
                      </h3>
                      <p className="text-xs opacity-90 line-clamp-1">
                        {lp.catchphrase}
                      </p>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:translate-x-2 transition-transform">
                      <span className="text-4xl font-bold">➝</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 7. 最新ブログ */}
        {latestPosts.length > 0 && (
          <section className="bg-slate-50 py-16 px-4 border-b border-slate-200 text-black">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    最新のブログ
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    プロの知恵袋とお知らせ
                  </p>
                </div>
                <Link
                  href="/blog"
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  ブログ一覧 ➝
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {latestPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-all"
                  >
                    <span className="text-[10px] text-slate-400 block mb-2">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ★ 追加: FAQ セクション */}
        <section className="bg-white py-16 px-4 border-b border-slate-100 text-black">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800">
                よくあるご質問
              </h2>
            </div>
            <div className="space-y-4">
              {topFaqs.map((faq, i) => (
                <div
                  key={i}
                  className="bg-slate-50 rounded-xl p-5 md:p-6 border border-slate-200"
                >
                  <h3 className="font-bold text-slate-800 text-base md:text-lg mb-2 flex gap-2">
                    <span className="text-blue-600 flex-shrink-0">Q.</span>
                    {faq.question}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed pl-6">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. CTA帯 */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-10 px-4 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl md:text-2xl font-black mb-2">
              まずはお気軽にご相談ください
            </h2>
            <p className="text-blue-100 text-sm mb-6">
              お見積りは無料です。お電話またはネットからどうぞ。
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="tel:0120-792-684"
                className="bg-white text-blue-700 px-8 py-4 rounded-full font-black text-lg hover:bg-blue-50 transition-colors shadow-lg inline-flex items-center gap-2"
              >
                📞 0120-792-684
              </a>
              <Link
                href="/service"
                className="bg-white/10 border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-colors"
              >
                ネットで見積・予約
              </Link>
            </div>
            <p className="text-blue-200 text-xs mt-3">
              受付時間 9:00〜18:00（年中無休）
            </p>
          </div>
        </section>

        {/* 対応エリア（テキスト案内＋地域リンクを統合） */}
        <ServiceArea
          regionalLinks={regionalLPs.map((lp) => ({
            id: lp.id,
            slug: lp.slug,
            title: lp.linkTitle || lp.title,
          }))}
        />
      </HomeClient>
    </>
  );
}
