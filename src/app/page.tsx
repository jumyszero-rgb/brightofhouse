// @/src/app/page.tsx
import prisma from "@/lib/prisma";
import { cheapestBookingMenu } from "@/lib/bookingMenuToBookingData";
import type { Metadata } from "next";
import AfterImageMarquee from "@/components/AfterImageMarquee";
import PromotionVideoGallery from "@/components/PromotionVideoGallery";
import TopPriceSection from "@/components/TopPriceSection";
import PopularPlans from "@/components/top/PopularPlans";
import ServiceArea from "@/components/ServiceArea";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title:
    "札幌の水回りクリーニング・ハウスクリーニング｜北海道ブライトオブハウス",
  description:
    "札幌市の水回りクリーニング・ハウスクリーニング専門店。キッチン・浴室・トイレ・換気扇の清掃、排水管高圧洗浄、ゴミ屋敷片付けまで対応。口コミ★4.9、明朗価格。お見積り無料。",
  alternates: {
    canonical: "/",
  },
};

const PHONE = "0120-792-684";

// FAQデータ（トップページ用）
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

// 6つの得意分野（固定のマーケティングカード。リンクはサービス一覧へ）
const SERVICE_CATS = [
  {
    title: "ハウスクリーニング",
    color: "#ffd34e",
    emoji: "🏠",
    desc: "空室、入退去時の清掃に格安で対応！お部屋まるごと、プロの技術でリセット！在居中のお部屋にも対応！",
  },
  {
    title: "水回りクリーニング",
    color: "#4fd6e6",
    emoji: "💧",
    desc: "浴室・キッチン・トイレ・洗面の水アカやカビを徹底洗浄。単品はもちろん、セットならまとめてお得に対応します！",
  },
  {
    title: "床ワックス＆剥離",
    color: "#ffab4d",
    emoji: "✨",
    desc: "古くくすんだ床のワックスを剥離して丁寧に塗り直し。見違えるツヤが復活し、汚れの付着も防ぎます！",
  },
  {
    title: "壁の再生",
    color: "#b79cff",
    emoji: "🧱",
    desc: "壁紙の黄ばみ・黒ずみ・タバコのヤニに。貼り替えずに再生できるからコストを大幅カット。まずはご相談を！",
  },
  {
    title: "消臭・除菌",
    color: "#69db7c",
    emoji: "🌿",
    desc: "ペット臭・タバコ・生活臭やゴミ屋敷後のニオイまで。専用の消臭・除菌でお部屋の空気そのものをリセット！",
  },
  {
    title: "ゴミ屋敷片付け・遺品整理",
    color: "#ff8f8f",
    emoji: "🚚",
    desc: "大量のお片付けから搬出・清掃までワンストップで対応。プライバシー厳守。※片付けは札幌市内限定です。",
  },
];

// お悩み（誘導）
const PAINS = [
  { icon: "😓", text: "自分で掃除しても汚れが落ちない" },
  { icon: "🕒", text: "忙しくて掃除の時間がとれない" },
  { icon: "🏚️", text: "退去・空室で原状回復を急いでいる" },
  { icon: "💸", text: "大手に頼むと高い…でも品質は落としたくない" },
];

// 選ばれる理由（6項目・インラインSVGアイコン）
const REASONS: { title: string; desc: string; path: string }[] = [
  {
    title: "明朗会計・追加料金なし",
    desc: "見積り無料。作業前に必ず金額を明示します。",
    path: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z M7 7h.01",
  },
  {
    title: "プロの技術と機材",
    desc: "市販品では落ちない汚れも根本から除去します。",
    path: "M14.7 6.3a4 4 0 0 0-5.66 5.66l-6.34 6.34a2 2 0 1 0 2.83 2.83l6.34-6.34a4 4 0 0 0 5.66-5.66l-3 3-2.83-2.83 3-3z",
  },
  {
    title: "札幌最安水準の価格",
    desc: "大手より圧倒的に安い価格設定。「安かろう悪かろう」ではありません。低価格でもプロの仕上がりをお約束します。",
    path: "M23 18 13.5 8.5 8.5 13.5 1 6 M17 18h6v-6",
  },
  {
    title: "損害賠償保険に加入",
    desc: "万一の際も補償があるので安心してお任せいただけます。",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2.5 2.5L16 9.5",
  },
  {
    title: "スタッフの対応品質",
    desc: "丁寧・誠実な接客とプライバシー厳守を徹底しています。",
    path: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  },
  {
    title: "口コミ★4.9（200件超）",
    desc: "大手口コミサイトで200件を超えるレビュー、総合評価★4.9。多くのお客様にご満足いただいている実績があります。",
    path: "M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z",
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

  // 6分野カードのリンク先：サービス一覧の該当カテゴリへ（タイトル一致でアンカー、無ければ /service）
  const serviceCategories = await prisma.serviceCategory.findMany({
    select: { id: true, title: true },
  });
  const norm = (s: string) => s.replace(/[\s　・＆&]/g, "");
  const catHref = (title: string) => {
    const t = norm(title);
    const hit = serviceCategories.find((c) => {
      const ct = norm(c.title);
      return ct === t || ct.includes(t) || t.includes(ct);
    });
    return hit ? `/service#cat-${hit.id}` : "/service";
  };

  // 得意分野カード：DB(ServiceFeature)があればそれを、無ければ既定の6分野を使う
  const dbFeatures = await prisma.serviceFeature.findMany({ orderBy: { order: "asc" } }).catch(() => []);
  const features =
    dbFeatures.length > 0
      ? dbFeatures.map((f) => ({
          title: f.title,
          color: f.color || "#ffd34e",
          emoji: "",
          desc: f.description || "",
          imageUrl: f.imageUrl || null,
          href: f.link || catHref(f.title),
        }))
      : SERVICE_CATS.map((c) => ({ ...c, imageUrl: null as string | null, href: catHref(c.title) }));

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
    geo: { "@type": "GeoCoordinates", latitude: 43.061, longitude: 141.385 },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
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

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: topFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const heroTitle = settings?.title || "北海道ブライトオブハウス";
  const heroSubtitle =
    settings?.subtitle || "水回りクリーニング / ハウスクリーニング / ゴミ屋敷清掃";
  const btn1Text = settings?.btn1Text || "無料で相談・見積り";
  const btn1Link = settings?.btn1Link || "/service";
  const heroImage = (settings as any)?.heroImage as string | undefined;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="bg-white text-[#0f1e2e]">
        {/* ===== ヒーロー ===== */}
        <section className="relative overflow-hidden text-white">
          {/* 背景：admin画像があれば使用、無ければグラデーション */}
          {heroImage ? (
            <>
              <img
                src={heroImage}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#081e32]/85 via-[#081e32]/60 to-[#081e32]/30" aria-hidden />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a568f] via-[#0e7ad1] to-[#12b5a6]" aria-hidden />
          )}
          <div className="relative max-w-5xl mx-auto px-5 py-16 md:py-24">
            <p className="text-xs md:text-sm font-bold tracking-[.2em] text-white/85 mb-3">
              札幌・近郊のハウスクリーニング
            </p>
            <h1 className="text-3xl md:text-5xl font-black leading-tight drop-shadow-sm">
              {heroTitle}
            </h1>
            <p className="mt-4 text-sm md:text-lg text-white/90 font-medium max-w-2xl">
              {heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={btn1Link}
                className="bg-[#f5a524] text-[#3a2a02] font-black py-3.5 px-8 rounded-full shadow-lg hover:brightness-105 transition-all"
              >
                {btn1Text}
              </Link>
              <a
                href={`tel:${PHONE.replace(/-/g, "")}`}
                className="bg-white/15 backdrop-blur-sm border border-white/40 text-white font-bold py-3.5 px-8 rounded-full hover:bg-white/25 transition-all"
              >
                📞 {PHONE}
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="bg-white/15 border border-white/25 text-white text-[11px] md:text-xs font-bold px-3 py-1 rounded-full">
                見積り無料・追加料金なし
              </span>
              <span className="bg-white/15 border border-white/25 text-white text-[11px] md:text-xs font-bold px-3 py-1 rounded-full">
                ⭐ 口コミ★4.9（200件超）
              </span>
              <span className="bg-white/15 border border-white/25 text-white text-[11px] md:text-xs font-bold px-3 py-1 rounded-full">
                💰 札幌最安水準
              </span>
            </div>
          </div>
        </section>

        {/* ===== 実績バー ===== */}
        <section className="bg-[#0a568f] text-white">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-white/15">
            {[
              { b: "年間300件+", s: "施工実績" },
              { b: "★4.9", s: "口コミ評価" },
              { b: "最短即日", s: "スピード対応" },
              { b: "年中無休", s: "受付対応" },
            ].map((x, i) => (
              <div key={i} className="text-center py-5 px-2">
                <div className="text-xl md:text-2xl font-black">{x.b}</div>
                <div className="text-[11px] md:text-xs text-white/80 mt-1">{x.s}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== お悩み → 誘導 ===== */}
        <section className="py-14 md:py-16 px-4 bg-[#f4f8fb]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-xs font-bold tracking-[.15em] text-[#0e7ad1]">YOUR TROUBLES</p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 mt-2">こんなお悩みありませんか？</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {PAINS.map((p, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#e7ecf1] p-4 md:p-5 text-center shadow-[0_6px_16px_rgba(15,30,46,.05)]">
                  <div className="text-3xl md:text-4xl mb-2">{p.icon}</div>
                  <p className="text-xs md:text-sm font-bold text-slate-700 leading-snug">{p.text}</p>
                </div>
              ))}
            </div>
            <p className="text-center mt-7 text-lg md:text-xl font-black text-slate-800">
              その悩み、<span className="text-[#0e7ad1]">これで解決します。</span>
            </p>
          </div>
        </section>

        {/* ===== 6つの得意分野 ===== */}
        <section className="py-14 md:py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-9">
              <p className="text-xs font-bold tracking-[.15em] text-[#0e7ad1]">SERVICE</p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 mt-2">おすすめ作業</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((c) => (
                <Link
                  key={c.title}
                  href={c.href}
                  className="group relative rounded-2xl overflow-hidden min-h-[190px] flex items-end text-white shadow-[0_10px_24px_rgba(15,30,46,.12)]"
                >
                  {c.imageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.imageUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#cfe4f5] to-[#e8f3ee] flex items-center justify-center text-5xl" aria-hidden>
                      {c.emoji}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081e32]/90 via-[#081e32]/40 to-[#081e32]/10" aria-hidden />
                  <div className="relative p-4 md:p-5">
                    <h3
                      className="text-lg md:text-xl font-black mb-1.5"
                      style={{
                        color: c.color,
                        WebkitTextStroke: "1.2px #0b1622",
                        paintOrder: "stroke fill",
                        textShadow: "0 2px 6px rgba(0,0,0,.55)",
                      } as React.CSSProperties}
                    >
                      {c.title}
                    </h3>
                    <p className="text-[13px] leading-snug opacity-95">{c.desc}</p>
                    <span className="inline-block mt-3 bg-white text-[#14324d] font-bold text-[13px] px-4 py-1.5 rounded-full group-hover:brightness-105">
                      詳しく見る →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 人気の作業・おすすめプラン（予約マスター連動・画像付き） ===== */}
        <PopularPlans />
        {/* 従来の単品価格アピール */}
        <TopPriceSection />

        {/* ===== ビフォーアフター ===== */}
        {afterImages.length > 0 && <AfterImageMarquee images={afterImages} />}

        {/* プロモーション動画 */}
        <PromotionVideoGallery videos={videos} />

        {/* ===== 選ばれる理由（6項目） ===== */}
        <section className="py-14 md:py-16 px-4 bg-[#f4f8fb]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-bold tracking-[.15em] text-[#0e7ad1]">WHY US</p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 mt-2">選ばれる理由</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {REASONS.map((r) => (
                <div key={r.title} className="text-center px-2">
                  <div className="w-[88px] h-[88px] md:w-24 md:h-24 rounded-full bg-white mx-auto mb-4 flex items-center justify-center shadow-[0_6px_16px_rgba(14,122,209,.12)]">
                    <svg viewBox="0 0 24 24" className="w-11 h-11 md:w-12 md:h-12" fill="none" stroke="#0e7ad1" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                      {r.path.split(" M").map((seg, idx) => (
                        <path key={idx} d={idx === 0 ? seg : `M${seg}`} />
                      ))}
                    </svg>
                  </div>
                  <h3 className="text-base md:text-lg font-black text-slate-800 mb-1.5">{r.title}</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== キャンペーン情報 ===== */}
        {featuredLPs.length > 0 && (
          <section className="bg-white py-10 px-4 border-b border-slate-100 text-black">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">HOT</span>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">キャンペーン情報</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredLPs.map((lp) => (
                  <Link
                    key={lp.id}
                    href={`/lp/${lp.slug}`}
                    className="group relative flex flex-col justify-center bg-gradient-to-br from-red-500 to-orange-500 p-5 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all overflow-hidden text-white"
                  >
                    <div className="relative z-10">
                      <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full mb-2 inline-block uppercase">Campaign</span>
                      <h3 className="font-black text-lg leading-tight mb-1 group-hover:underline">{lp.linkTitle || lp.title}</h3>
                      <p className="text-xs opacity-90 line-clamp-1">{lp.catchphrase}</p>
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

        {/* ===== 最新ブログ ===== */}
        {latestPosts.length > 0 && (
          <section className="bg-white py-16 px-4 border-b border-slate-100 text-black">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">最新のブログ</h2>
                  <p className="text-xs text-slate-500 mt-1">プロの知恵袋とお知らせ</p>
                </div>
                <Link href="/blog" className="text-sm font-bold text-blue-600 hover:underline">ブログ一覧 ➝</Link>
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

        {/* ===== FAQ ===== */}
        <section className="bg-white py-16 px-4 border-b border-slate-100 text-black">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800">よくあるご質問</h2>
            </div>
            <div className="space-y-4">
              {topFaqs.map((faq, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-5 md:p-6 border border-slate-200">
                  <h3 className="font-bold text-slate-800 text-base md:text-lg mb-2 flex gap-2">
                    <span className="text-blue-600 flex-shrink-0">Q.</span>
                    {faq.question}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed pl-6">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA帯 ===== */}
        <section className="relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a568f] to-[#12b5a6]" aria-hidden />
          <div className="relative max-w-3xl mx-auto px-4 py-14 md:py-16 text-center">
            <h2 className="text-2xl md:text-3xl font-black">まずは無料で相談・お見積り</h2>
            <p className="mt-3 text-white/90 text-sm md:text-base">
              お電話・フォーム・LINEでお気軽にどうぞ。しつこい営業は一切ございません。
            </p>
            <a href={`tel:${PHONE.replace(/-/g, "")}`} className="block mt-6 text-3xl md:text-4xl font-black tracking-wider">
              📞 {PHONE}
            </a>
            <p className="text-xs text-white/80 mt-1">受付 9:00〜18:00（年中無休）</p>
            <Link
              href="/service"
              className="inline-block mt-6 bg-[#f5a524] text-[#3a2a02] font-black py-4 px-12 rounded-full shadow-lg hover:brightness-105 transition-all text-lg"
            >
              フォームで無料見積り
            </Link>
          </div>
        </section>

        {/* 対応エリア */}
        <ServiceArea
          regionalLinks={regionalLPs.map((lp) => ({
            id: lp.id,
            slug: lp.slug,
            title: lp.linkTitle || lp.title,
          }))}
        />
      </main>
    </>
  );
}
