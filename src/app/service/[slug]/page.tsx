// @/src/app/service/[slug]/page.tsx
import { notFound, permanentRedirect } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ServicePageBooking from "@/components/booking/ServicePageBooking";
import { serviceItemToBookingData } from "@/lib/serviceItemToBookingData";
import { bookingSelectionToBookingData, cheapestBookingMenu, roundAmount, HIDE_ALL_DISPLAY_MENUS } from "@/lib/bookingMenuToBookingData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.servicePage.findFirst({ where: { slug } });

  if (!page || page.status === "DRAFT")
    return { title: "ページが見つかりません" };

  const SET_PAGES = [
    "water-area-cleaning-special-set",
    "water-area-cleaning-3set-campaign",
    "water-area-cleaning-4-set",
    "water-area-cleaning-5-piece-set",
  ];

  const canonicalPath = SET_PAGES.includes(slug)
    ? "/service/water-area-cleaning-sapporo"
    : `/service/${slug}`;

  return {
    title: page.title,
    description: page.metaDescription || page.catchphrase || "サービス詳細情報",
    ...(page.noIndex && { robots: { index: false, follow: true } }),
    alternates: {
      canonical: page.canonicalUrl || canonicalPath,
    },
  };
}

export default async function ServiceDetailPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "true";

  const subMenusInclude = {
    subMenus: {
      include: { options: { orderBy: { order: "asc" as const } } },
      orderBy: { order: "asc" as const },
    },
    options: { orderBy: { order: "asc" as const } },
  } as const;

  const serviceItemInclude = {
    serviceItem: { include: { details: true, options: true } },
    bookingMenus: { include: subMenusInclude },
    bookingCategories: { include: { menus: { include: subMenusInclude } } },
    faqs: { orderBy: { order: "asc" } },
    testimonials: { where: { isActive: true }, orderBy: { order: "asc" } },
  } as const;

  const page = isPreview
    ? await prisma.servicePage.findFirst({ where: { slug }, include: serviceItemInclude })
    : await prisma.servicePage.findFirst({
        where: { slug, status: "PUBLISHED" },
        include: serviceItemInclude,
      });

  if (!page) notFound();

  if (page.redirectUrl && !isPreview) {
    permanentRedirect(page.redirectUrl);
  }

  // 連動するServiceItemの価格・所要時間を常に自動反映（bookingDataの有無に関わらず表示）
  const linkedItem = page.serviceItem;
  const linkedMenus = page.bookingMenus;
  const linkedCategories = page.bookingCategories;
  // 表示用: 大分類経由のメニューも直接リンクのメニューと同列に扱う。
  // displayMenuIdsで絞り込まれていればその項目のみ、未設定(空)なら全件を「現在の料金」欄に表示する
  // （予約フォーム自体は絞り込まず、連動した項目すべてが常に選択可能）。
  const allLinkedMenus = [...linkedMenus, ...linkedCategories.flatMap((c) => c.menus)];
  const hideAllDisplayMenus = page.displayMenuIds.includes(HIDE_ALL_DISPLAY_MENUS);
  const displayMenus = hideAllDisplayMenus
    ? []
    : page.displayMenuIds.length > 0
      ? allLinkedMenus.filter((m) => page.displayMenuIds.includes(m.id))
      : allLinkedMenus;

  // 予約マスター(BookingMenu/BookingCategory)にリンクされている場合は常にそちらを正とする（価格ズレ防止）。
  // リンクが無いページは手入力のbookingData、それも無ければ旧ServiceItemから自動生成。
  const effectiveBookingData = (linkedMenus.length > 0 || linkedCategories.length > 0)
    ? bookingSelectionToBookingData(linkedCategories, linkedMenus)
    : page.bookingData
      ? (page.bookingData as any)
      : linkedItem
        ? serviceItemToBookingData(linkedItem)
        : null;

  // ★ 追加: 関連サービスページを取得
  const relatedServices = await prisma.servicePage.findMany({
    where: {
      status: "PUBLISHED",
      noIndex: false,
      slug: { not: slug },
    },
    select: {
      slug: true, title: true, catchphrase: true, cardIcon: true,
      bookingMenus: { select: { basePrice: true, priceNote: true, discountPercent: true, discountRounding: true, webSpecialPrice: true } },
      bookingCategories: { select: { menus: { select: { basePrice: true, priceNote: true, discountPercent: true, discountRounding: true, webSpecialPrice: true } } } },
    },
    orderBy: { createdAt: "asc" },
    take: 6,
  });

  // ★ 追加: エリアページを取得（内部リンク用）
  const areaPages = await prisma.landingPage.findMany({
    where: { status: "PUBLISHED", category: "AREA" },
    orderBy: { title: "asc" },
    select: { slug: true, linkTitle: true, title: true },
  });

  const phoneNumber = "0120-792-684";

  // ★ 追加: Service構造化データ
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.title,
    description: page.metaDescription || page.catchphrase || "",
    provider: {
      "@type": "LocalBusiness",
      name: "北海道ブライトオブハウス",
      url: "https://brightofhouse.jp",
      telephone: phoneNumber,
      address: {
        "@type": "PostalAddress",
        addressLocality: "札幌市白石区",
        addressRegion: "北海道",
        addressCountry: "JP",
      },
    },
    areaServed: {
      "@type": "City",
      name: "札幌市",
    },
  };

  // ★ 追加: BreadcrumbList構造化データ
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "トップ",
        item: "https://brightofhouse.jp",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "サービス・料金表",
        item: "https://brightofhouse.jp/service",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: page.title,
        item: `https://brightofhouse.jp/service/${slug}`,
      },
    ],
  };

  // 構造化データ: FAQPage
  const faqJsonLd = page.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <main className="min-h-screen bg-white pb-20 text-black">
        {/* プレビューバナー */}
        {isPreview && (
          <div className="bg-yellow-400 text-black text-center py-2 text-sm font-bold sticky top-0 z-50">
            ⚠ プレビュー表示中（このページは公開されていません）
          </div>
        )}

        <nav className="bg-slate-50 border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center">
            <Link
              href="/service"
              className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>←</span> サービス一覧に戻る
            </Link>
          </div>
        </nav>

        {/* ヒーロー */}
        <div className="relative w-full py-16 md:py-24 bg-slate-900 text-white flex items-center justify-center overflow-hidden">
          {page.heroImage && (
            <Image
              src={page.heroImage}
              alt={page.title}
              fill
              className="object-cover opacity-40"
              priority
            />
          )}
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-black mb-4 drop-shadow-md">
              {page.title}
            </h1>
            {page.catchphrase && (
              <p className="text-lg md:text-xl opacity-90 drop-shadow-sm font-medium mb-8">
                {page.catchphrase}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="#booking"
                className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-700 transition-all w-64"
              >
                仮予約・お見積り
              </Link>
              <Link
                href="#booking"
                className="bg-white/20 backdrop-blur-sm text-white border border-white/50 font-bold py-3 px-8 rounded-full hover:bg-white/30 transition-all w-64"
              >
                通常のお問い合わせはこちら
              </Link>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* 現在の料金（予約マスター or 連動するServiceItemから自動反映。料金改定時に手動更新不要） */}
          {displayMenus.length === 1 ? (
            <div className="bg-white border-2 border-blue-100 rounded-2xl p-6 mb-12 shadow-sm">
              <p className="text-xs font-bold text-blue-600 mb-2">現在の料金</p>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
                {displayMenus[0].basePrice > 0 && (
                  displayMenus[0].webSpecialPrice != null ? (
                    <>
                      <span className="text-lg text-slate-400 line-through">
                        ¥{displayMenus[0].basePrice.toLocaleString()}
                      </span>
                      <span className="text-3xl md:text-4xl font-black text-red-600">
                        ¥{displayMenus[0].webSpecialPrice.toLocaleString()}
                      </span>
                    </>
                  ) : displayMenus[0].discountPercent ? (
                    <>
                      <span className="text-lg text-slate-400 line-through">
                        ¥{displayMenus[0].basePrice.toLocaleString()}
                      </span>
                      <span className="text-3xl md:text-4xl font-black text-red-600">
                        ¥{roundAmount((displayMenus[0].basePrice * (100 - displayMenus[0].discountPercent)) / 100, displayMenus[0].discountRounding).toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl md:text-4xl font-black text-slate-800">
                      ¥{displayMenus[0].basePrice.toLocaleString()}
                    </span>
                  )
                )}
                {(displayMenus[0].durationMin > 0 || (displayMenus[0].durationMax ?? 0) > 0) && (
                  <span className="text-sm text-slate-500">
                    (税込・目安時間 {displayMenus[0].durationMin}
                    {displayMenus[0].durationMax && displayMenus[0].durationMax !== displayMenus[0].durationMin ? `〜${displayMenus[0].durationMax}` : ""}
                    分〜)
                  </span>
                )}
              </div>
              {displayMenus[0].workContent && (
                <ul className="text-sm text-slate-600 divide-y divide-slate-100 border-t border-slate-100">
                  {displayMenus[0].workContent.split("\n").filter(Boolean).map((line, i) => (
                    <li key={i} className="py-2">{line}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : displayMenus.length > 1 ? (
            <div className="bg-white border-2 border-blue-100 rounded-2xl p-6 mb-12 shadow-sm space-y-5">
              <p className="text-xs font-bold text-blue-600">現在の料金</p>
              {displayMenus.map((menu) => (
                <div key={menu.id} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                  <p className="font-bold text-slate-800 text-sm mb-1">{menu.title}</p>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {menu.basePrice > 0 && (
                      menu.webSpecialPrice != null ? (
                        <>
                          <span className="text-sm text-slate-400 line-through">
                            ¥{menu.basePrice.toLocaleString()}
                          </span>
                          <span className="text-2xl font-black text-red-600">
                            ¥{menu.webSpecialPrice.toLocaleString()}
                          </span>
                        </>
                      ) : menu.discountPercent ? (
                        <>
                          <span className="text-sm text-slate-400 line-through">
                            ¥{menu.basePrice.toLocaleString()}
                          </span>
                          <span className="text-2xl font-black text-red-600">
                            ¥{roundAmount((menu.basePrice * (100 - menu.discountPercent)) / 100, menu.discountRounding).toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-black text-slate-800">
                          ¥{menu.basePrice.toLocaleString()}
                        </span>
                      )
                    )}
                    {(menu.durationMin > 0 || (menu.durationMax ?? 0) > 0) && (
                      <span className="text-xs text-slate-500">
                        (税込・目安時間 {menu.durationMin}
                        {menu.durationMax && menu.durationMax !== menu.durationMin ? `〜${menu.durationMax}` : ""}
                        分〜)
                      </span>
                    )}
                  </div>
                  {menu.workContent && (
                    <ul className="text-sm text-slate-600 divide-y divide-slate-100 border-t border-slate-100 mt-2">
                      {menu.workContent.split("\n").filter(Boolean).map((line, i) => (
                        <li key={i} className="py-2">{line}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : linkedItem && !hideAllDisplayMenus && (
            <div className="bg-white border-2 border-blue-100 rounded-2xl p-6 mb-12 shadow-sm">
              <p className="text-xs font-bold text-blue-600 mb-2">現在の料金</p>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
                <span className="text-3xl md:text-4xl font-black text-slate-800">
                  ¥{linkedItem.basePrice.toLocaleString()}
                </span>
                <span className="text-sm text-slate-500">
                  (税込・目安時間 {linkedItem.estimatedMinutes}分〜)
                </span>
              </div>
              {linkedItem.details.length > 0 && (
                <ul className="text-sm text-slate-600 divide-y divide-slate-100 border-t border-slate-100">
                  {linkedItem.details.map((d) => (
                    <li key={d.id} className="flex justify-between py-2">
                      {d.label && <span className="text-slate-500">{d.label}</span>}
                      <span className={d.label ? "font-bold" : ""}>{d.value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {page.content && (
            <div
              className="ql-content prose prose-lg md:prose-xl max-w-none text-slate-700 leading-loose mb-20"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          )}

          {/* お客様の声 */}
          {page.testimonials.length > 0 && (
            <section className="mb-16">
              <h2 className="text-xl font-black text-slate-800 mb-6">お客様の声</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {page.testimonials.map((t) => (
                  <div key={t.id} className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                    {t.rating && (
                      <p className="text-amber-500 text-sm mb-2" aria-hidden>
                        {"★".repeat(t.rating)}
                        <span className="text-amber-200">{"★".repeat(5 - t.rating)}</span>
                      </p>
                    )}
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{t.body}</p>
                    <p className="text-xs text-slate-400 mt-3 font-bold">{t.authorLabel}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
          {page.faqs.length > 0 && (
            <section className="mb-16">
              <h2 className="text-xl font-black text-slate-800 mb-6">よくあるご質問</h2>
              <div className="space-y-3">
                {page.faqs.map((faq) => (
                  <div key={faq.id} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <p className="font-bold text-slate-800 mb-2 flex gap-2">
                      <span className="text-blue-600 flex-shrink-0">Q.</span>
                      {faq.question}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed pl-6">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 予約・問い合わせ */}
          <div id="booking" className="mt-20 scroll-mt-20">
            {effectiveBookingData ? (
              <ServicePageBooking
                pageTitle={page.title}
                bookingData={effectiveBookingData}
              />
            ) : (
              <div className="bg-blue-50 rounded-3xl p-8 md:p-16 text-center border-2 border-blue-100 shadow-xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 text-blue-100 text-9xl font-black opacity-50">
                  CONTACT
                </div>
                <h3 className="relative z-10 text-2xl md:text-4xl font-black text-slate-800 mb-6">
                  お見積り・ご相談
                </h3>
                <p className="relative z-10 text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                  お客様のご要望に合わせて柔軟に対応いたします。
                  <br />
                  まずはお気軽にお問い合わせください。
                </p>
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <Link
                    href="/contact"
                    className="inline-block bg-blue-600 text-white text-xl font-bold py-5 px-12 rounded-full shadow-lg hover:bg-blue-700 transition-all w-full md:w-auto"
                  >
                    お問い合わせはこちら ➝
                  </Link>
                  <div className="pt-6 border-t border-blue-200 w-full max-w-md">
                    <p className="text-xs text-slate-400 mb-1">
                      お電話でのご相談はこちら
                    </p>
                    <a
                      href={`tel:${phoneNumber.replace(/-/g, "")}`}
                      className="text-2xl font-black text-slate-700 hover:text-blue-600 transition-colors tracking-widest font-mono"
                    >
                      {phoneNumber}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ★ 追加: 関連サービス */}
          {relatedServices.length > 0 && (
            <section className="mt-20">
              <h2 className="text-xl font-black text-slate-800 mb-6">
                その他のサービス
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {relatedServices.map((rs) => {
                  const cheapest = cheapestBookingMenu([...rs.bookingMenus, ...rs.bookingCategories.flatMap((c) => c.menus)]);
                  return (
                  <Link
                    key={rs.slug}
                    href={`/service/${rs.slug}`}
                    className="group bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl p-4 transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg leading-none flex-shrink-0" aria-hidden>
                        {rs.cardIcon || "🧹"}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 group-hover:text-blue-600 text-sm md:text-base leading-snug transition-colors">
                          {rs.title}
                        </h3>
                        {rs.catchphrase && (
                          <p className="text-[10px] md:text-xs text-slate-400 mt-1 line-clamp-2">
                            {rs.catchphrase}
                          </p>
                        )}
                        {cheapest && (cheapest.basePrice > 0 || cheapest.priceNote) && (
                          <p className="text-[10px] md:text-xs font-bold text-blue-600 mt-1">
                            {cheapest.priceNote && <span className="mr-0.5">{cheapest.priceNote}</span>}
                            {cheapest.basePrice > 0 && (
                              (cheapest.discountPercent || cheapest.webSpecialPrice != null) ? (
                                <>
                                  <span className="text-slate-400 line-through mr-1">¥{cheapest.basePrice.toLocaleString()}</span>
                                  <span className="text-red-600">¥{cheapest.effectivePrice.toLocaleString()}〜</span>
                                </>
                              ) : (
                                <>¥{cheapest.basePrice.toLocaleString()}〜</>
                              )
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
              <div className="text-center mt-4">
                <Link
                  href="/service"
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  サービス・料金表の一覧を見る →
                </Link>
              </div>
            </section>
          )}

          {/* ★ 追加: 対応エリアリンク */}
          {areaPages.length > 0 && (
            <section className="mt-16">
              <h2 className="text-xl font-black text-slate-800 mb-6">
                対応エリア
              </h2>
              <div className="flex flex-wrap gap-2">
                {areaPages.map((area) => (
                  <Link
                    key={area.slug}
                    href={`/area/${area.slug}`}
                    className="bg-slate-50 border border-slate-200 text-slate-600 text-xs md:text-sm font-medium py-2 px-4 rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    {area.linkTitle || area.title}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
