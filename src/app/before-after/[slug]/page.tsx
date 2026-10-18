// @/src/app/before-after/[slug]/page.tsx
// 施工事例（ビフォーアフター）の単体ページ。
// - slug が入っている事例だけ表示（slug なし＝一覧のみ）
// - 「検索に表示する」(indexable) がオフの事例は noindex（sitemap.xml にも載せない）
// - 項目ごとの本文は見出し付きで表示し、未入力の項目は出さない
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";
import PhoneLink from "@/components/PhoneLink";
import { BA_SECTIONS, baAutoDescription, mergeLegacyDescription } from "@/lib/beforeAfterText";

export const dynamic = "force-dynamic";

const BASE_URL = "https://brightofhouse.jp";

type Props = { params: Promise<{ slug: string }> };

async function getItem(slug: string) {
  return prisma.beforeAfter.findUnique({
    where: { slug },
    include: {
      servicePages: {
        where: { status: "PUBLISHED" },
        select: { slug: true, title: true, linkTitle: true },
      },
    },
  });
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric" }).format(d);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getItem(decodeURIComponent(slug));
  if (!item) return { title: "施工事例が見つかりません", robots: { index: false, follow: true } };

  const title = item.metaTitle || item.title;
  const description = item.metaDescription || baAutoDescription(item);
  return {
    title,
    description,
    alternates: { canonical: `/before-after/${item.slug}` },
    // 「検索に表示する」がオフの事例は noindex（リンクはたどってよい）
    robots: item.indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/before-after/${item.slug}`,
      type: "article",
      images: item.afterUrl ? [{ url: item.afterUrl }] : undefined,
    },
  };
}

export default async function BeforeAfterDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getItem(decodeURIComponent(slug));
  if (!item || !item.slug) notFound();

  const description = mergeLegacyDescription(item.description);
  const sections = BA_SECTIONS.map((s) => ({ ...s, text: (item[s.key] || "").trim() })).filter((s) => s.text);

  // 同じエリア・同じ作業の他の事例（単体ページがあるものだけ・最大3件）
  const orConds: object[] = [];
  if (item.area) orConds.push({ area: item.area });
  if (item.workName) orConds.push({ workName: item.workName });
  if (item.category) orConds.push({ category: item.category });
  const related = orConds.length
    ? await prisma.beforeAfter.findMany({
        where: { id: { not: item.id }, slug: { not: null }, OR: orConds },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { slug: true, title: true, afterUrl: true, area: true, workName: true, createdAt: true },
      })
    : [];

  const pageUrl = `${BASE_URL}/before-after/${item.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: item.title,
    description: item.metaDescription || baAutoDescription(item),
    image: [item.afterUrl, item.beforeUrl].filter(Boolean),
    datePublished: item.createdAt,
    dateModified: item.updatedAt,
    mainEntityOfPage: pageUrl,
    author: { "@type": "Organization", name: "北海道ブライトオブハウス", url: BASE_URL },
    publisher: { "@type": "Organization", name: "北海道ブライトオブハウス", url: BASE_URL },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: `${BASE_URL}/` },
      { "@type": "ListItem", position: 2, name: "清掃実績", item: `${BASE_URL}/before-after` },
      { "@type": "ListItem", position: 3, name: item.title, item: pageUrl },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 sm:py-16 px-4 sm:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <article className="max-w-3xl mx-auto">
        {/* 見出し */}
        <header className="mb-6">
          <p className="text-xs font-bold text-blue-600 mb-2">施工事例</p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 leading-snug">{item.title}</h1>
          <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
            <div className="flex gap-1">
              <dt className="text-slate-400">施工日</dt>
              <dd>
                <time dateTime={item.createdAt.toISOString()}>{formatDate(item.createdAt)}</time>
              </dd>
            </div>
            {item.area && (
              <div className="flex gap-1">
                <dt className="text-slate-400">エリア</dt>
                <dd>{item.area}</dd>
              </div>
            )}
            {(item.workName || item.category) && (
              <div className="flex gap-1">
                <dt className="text-slate-400">作業内容</dt>
                <dd>{item.workName || item.category}</dd>
              </div>
            )}
          </dl>
        </header>

        {/* ビフォー／アフター */}
        <div className="rounded-2xl overflow-hidden shadow-md bg-white mb-8">
          <BeforeAfterSlider beforeSrc={item.beforeUrl} afterSrc={item.afterUrl} alt={item.title} priority />
        </div>

        {/* 本文 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-8 space-y-8">
          {description && (
            <p className="text-slate-700 leading-loose whitespace-pre-wrap">{description}</p>
          )}
          {sections.map((s) => (
            <section key={s.key}>
              <h2 className="text-lg font-black text-slate-800 border-l-4 border-blue-600 pl-3 mb-3">{s.label}</h2>
              <p className="text-slate-700 leading-loose whitespace-pre-wrap">{s.text}</p>
            </section>
          ))}
        </div>

        {/* 関連サービス */}
        {item.servicePages.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-black text-slate-800 mb-3">この事例のサービス</h2>
            <ul className="flex flex-wrap gap-2">
              {item.servicePages.map((sp) => (
                <li key={sp.slug}>
                  <Link
                    href={`/service/${sp.slug}`}
                    className="inline-block bg-white border border-blue-200 text-blue-700 font-bold text-sm px-4 py-2 rounded-full hover:bg-blue-50"
                  >
                    {sp.linkTitle || sp.title} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 他の事例 */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-black text-slate-800 mb-3">ほかの施工事例</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <li key={r.slug!}>
                  <Link href={`/before-after/${r.slug}`} className="block bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.afterUrl} alt={r.title} loading="lazy" decoding="async" className="w-full h-32 object-cover" />
                    <div className="p-3">
                      <p className="text-[11px] text-slate-400">
                        {[r.area, r.workName].filter(Boolean).join("・") || formatDate(r.createdAt)}
                      </p>
                      <p className="text-sm font-bold text-slate-700 leading-snug line-clamp-2">{r.title}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-8 text-center">
          <Link href="/before-after" className="text-sm text-blue-600 font-bold hover:underline">
            ← 清掃実績の一覧へ
          </Link>
        </p>

        {/* 共通の定型文（ページ下部の1か所だけ） */}
        <aside className="mt-10 bg-blue-600 text-white rounded-2xl p-6 text-center">
          <p className="font-black text-lg">同じようなお悩みはご相談ください</p>
          <p className="text-sm text-blue-100 mt-1">お見積り無料・料金は作業前に確定します。</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/inquiry" className="bg-amber-400 text-slate-900 font-black px-6 py-3 rounded-full hover:bg-amber-300">
              サービスのお問い合わせ
            </Link>
            <PhoneLink className="bg-white text-blue-700 font-bold px-6 py-3 rounded-full hover:bg-blue-50" prefix="📞 " />
          </div>
        </aside>
      </article>
    </main>
  );
}
