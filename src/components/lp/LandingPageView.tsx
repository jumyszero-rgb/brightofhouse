// @/src/components/lp/LandingPageView.tsx
// LP公開描画の共通コンポーネント（サーバー）。
// templateStyle（SIMPLE / RICH / BLOCKS / HTML）で描画を出し分ける。
// /lp/[slug] と /lp/mizumawari/[item] の両ルートから使われ、
// どのURLでも同じテンプレ切替（全面HTML含む）ができるようにする。
import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { memo } from "@/lib/serverMemo";
import { LazyServicePageBooking } from "@/components/lp/LazyLpForms";
import { bookingSelectionToBookingData, resolvePrice } from "@/lib/bookingMenuToBookingData";
import LpTemplate from "@/components/lp/LpTemplate";
import { landingPageToLpContent } from "@/lib/lpRichContent";
import LpBlocksRenderer from "@/components/lp/LpBlocksRenderer";
import { getShortcodeContext, applyShortcodesWith } from "@/lib/shortcodes";

const PHONE = "0120-792-684";
const LINE_URL = "https://line.me/ti/p/RBwKccvQ1O";

const subMenusInclude = {
  subMenus: {
    include: { options: { orderBy: { order: "asc" as const } } },
    orderBy: { order: "asc" as const },
  },
  options: { orderBy: { order: "asc" as const } },
} as const;

// カレンダー予約フォームブロックの大分類ID一覧（複数対応の refIds を優先、旧データの refId にもフォールバック）
function bookingFormCategoryIds(b: any): string[] {
  const ids: string[] = Array.isArray(b?.refs?.refIds) ? b.refs.refIds.filter(Boolean) : [];
  if (ids.length) return ids;
  return b?.refs?.refId ? [b.refs.refId] : [];
}

// メニュー（予約マスター連動）ブロックで選ばれた項目一覧（複数対応の refs.items を優先、旧データの refType/refId にもフォールバック）
function masterMenuItems(b: any): { refType: string; refId: string }[] {
  const items = Array.isArray(b?.refs?.items) ? b.refs.items.filter((x: any) => x && x.refId && x.refType) : [];
  if (items.length) return items;
  return b?.refs?.refId ? [{ refType: b.refs.refType || "menu", refId: b.refs.refId }] : [];
}

function PreviewBanner() {
  return (
    <div className="bg-yellow-400 text-black text-center py-2 text-sm font-bold sticky top-0 z-50">
      ⚠ プレビュー表示中（このページは公開されていません）
    </div>
  );
}

export default async function LandingPageView({
  lp,
  isPreview = false,
}: {
  lp: any;
  isPreview?: boolean;
}) {
  const effectiveBookingData =
    (lp.bookingMenus?.length > 0 || lp.bookingCategories?.length > 0)
      ? bookingSelectionToBookingData(lp.bookingCategories, lp.bookingMenus)
      : (lp.bookingData as any);

  // ===== RICH（セールスLP構成） =====
  if (lp.templateStyle === "RICH") {
    return (
      <>
        {isPreview && <PreviewBanner />}
        <LpTemplate content={landingPageToLpContent(lp)} bookingData={effectiveBookingData} />
      </>
    );
  }

  // SIMPLE / HTML の本文のショートコード展開（置き換え結果ごと作り置き）
  const contentKey = `lp:content:${lp.id}:${lp.updatedAt ? new Date(lp.updatedAt).getTime() : 0}`;
  const expandContent = async (): Promise<string> => {
    const raw: string = lp.content || "";
    if (!raw.includes("[[")) return raw;
    return memo(contentKey, async () => applyShortcodesWith(raw, await getShortcodeContext({ preview: isPreview })), { fresh: isPreview });
  };

  // ===== HTML（1枚もの全面表示。オレンジ帯ヒーロー・白カード枠なし） =====
  if (lp.templateStyle === "HTML") {
    const content = await expandContent();
    return (
      <>
        {isPreview && <PreviewBanner />}
        <div
          className="lp-fullhtml"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </>
    );
  }

  // ===== BLOCKS（ブロックビルダー） =====
  if (lp.templateStyle === "BLOCKS") {
    const rawBlocks = Array.isArray(lp.blocks) ? (lp.blocks as any[]) : [];
    const menuIds: string[] = [];
    const subMenuIds: string[] = [];
    const optionIds: string[] = [];
    const formCategoryIds: string[] = [];
    for (const b of rawBlocks) {
      if (b?.type === "masterMenu") {
        for (const it of masterMenuItems(b)) {
          if (it.refType === "menu") menuIds.push(it.refId);
          else if (it.refType === "subMenu") subMenuIds.push(it.refId);
          else if (it.refType === "option") optionIds.push(it.refId);
        }
      }
      if (b?.type === "bookingForm") formCategoryIds.push(...bookingFormCategoryIds(b));
    }
    // 口コミ・FAQ（サービス詳細ページと連動）・施工事例ブロックで選ばれたID
    const strIds = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x) : []);
    const voicePageIds = Array.from(new Set(rawBlocks.filter((b) => b?.type === "voices").flatMap((b) => strIds(b?.data?.servicePageIds))));
    const faqPageIds = Array.from(new Set(rawBlocks.filter((b) => b?.type === "faq").flatMap((b) => strIds(b?.data?.servicePageIds))));
    const baIds = Array.from(new Set(rawBlocks.filter((b) => b?.type === "beforeAfter").flatMap((b) => strIds(b?.data?.ids))));
    // 予約マスターの価格・大分類も作り置き（プレビュー時は常に最新。予約マスター保存で消える）
    const memoKey = `lp:blocks:${lp.id}:${lp.updatedAt ? new Date(lp.updatedAt).getTime() : 0}`;
    const [menus, subMenus, options] = await memo(`${memoKey}:prices`, () => Promise.all([
      menuIds.length ? prisma.bookingMenu.findMany({ where: { id: { in: menuIds } }, select: { id: true, title: true, basePrice: true, webSpecialPrice: true, discountPercent: true, discountRounding: true, priceFrom: true, workContent: true, recommendPoint: true, cautionNote: true } }) : Promise.resolve([] as any[]),
      subMenuIds.length ? prisma.bookingSubMenu.findMany({ where: { id: { in: subMenuIds } }, select: { id: true, title: true, price: true, webSpecialPrice: true, discountPercent: true, discountRounding: true, priceFrom: true, workContent: true, recommendPoint: true, cautionNote: true } }) : Promise.resolve([] as any[]),
      optionIds.length ? prisma.bookingOption.findMany({ where: { id: { in: optionIds } }, select: { id: true, title: true, price: true, discountPercent: true, discountRounding: true, priceFrom: true, workContent: true, recommendPoint: true, cautionNote: true } }) : Promise.resolve([] as any[]),
    ]), { fresh: isPreview });
    // 価格はカレンダー予約フォームと同じ計算（WEB特価 → 個別値引き%）。通常価格と違えば originalPrice も渡す
    const toItem = (x: any, base: number) => {
      const p = resolvePrice(base, x.webSpecialPrice ?? null, x.discountPercent ?? null, x.discountRounding);
      return {
        title: x.title,
        price: p.price,
        originalPrice: p.originalPrice,
        from: !!x.priceFrom,
        workContent: x.workContent,
        recommendPoint: x.recommendPoint,
        cautionNote: x.cautionNote,
      };
    };
    const resolved = {
      menus: Object.fromEntries(menus.map((m: any) => [m.id, toItem(m, m.basePrice)])),
      subMenus: Object.fromEntries(subMenus.map((s: any) => [s.id, toItem(s, s.price)])),
      options: Object.fromEntries(options.map((o: any) => [o.id, toItem(o, o.price)])),
    };
    const [testimonials, faqs, beforeAfters] = await memo(`${memoKey}:linked`, () => Promise.all([
      voicePageIds.length
        ? prisma.testimonial.findMany({ where: { servicePageId: { in: voicePageIds }, isActive: true }, orderBy: { order: "asc" }, select: { id: true, servicePageId: true, authorLabel: true, rating: true, body: true } })
        : Promise.resolve([] as any[]),
      faqPageIds.length
        ? prisma.serviceFaq.findMany({ where: { servicePageId: { in: faqPageIds } }, orderBy: { order: "asc" }, select: { id: true, servicePageId: true, question: true, answer: true } })
        : Promise.resolve([] as any[]),
      baIds.length
        ? prisma.beforeAfter.findMany({ where: { id: { in: baIds } }, select: { id: true, title: true, beforeUrl: true, afterUrl: true, slug: true } })
        : Promise.resolve([] as any[]),
    ]), { fresh: isPreview });
    const linked = {
      testimonials: testimonials as { id: string; servicePageId: string | null; authorLabel: string; rating: number | null; body: string }[],
      faqs: faqs as { id: string; servicePageId: string; question: string; answer: string }[],
      beforeAfters: beforeAfters as { id: string; title: string; beforeUrl: string; afterUrl: string; slug: string | null }[],
    };
    const uniqueFormCategoryIds = Array.from(new Set(formCategoryIds));
    const formCats: any[] = uniqueFormCategoryIds.length
      ? await memo(`${memoKey}:forms`, () => prisma.bookingCategory.findMany({ where: { id: { in: uniqueFormCategoryIds } }, include: { menus: { include: subMenusInclude } } }), { fresh: isPreview })
      : [];
    const catById = new Map<string, any>(formCats.map((c: any) => [c.id, c]));
    // ブロックごとに、選ばれた大分類（複数可）をまとめて1つの予約フォーム用データにする
    const bookingForms: Record<string, any> = {};
    for (const b of rawBlocks) {
      if (b?.type !== "bookingForm") continue;
      const catIds = bookingFormCategoryIds(b);
      const cats = catIds.map((id) => catById.get(id)).filter(Boolean);
      // 並びはこのブロックで指定した順（大分類＝選んだ順、中分類＝refs.menuOrder）。未指定なら予約マスターのカレンダー表示順
      const menuOrder: string[] = Array.isArray(b?.refs?.menuOrder) ? b.refs.menuOrder.filter(Boolean) : [];
      if (cats.length && b.id) {
        bookingForms[b.id] = bookingSelectionToBookingData(cats as any[], [], {
          categoryIds: b?.refs?.catOrderCustom ? catIds : undefined,
          menuIds: menuOrder,
        });
      }
    }
    // 本文中のショートコード（[[key]] と予約マスターの料金 [[price:…]] [[menu-list:…]] [[category-list:…]]）を展開。
    // 置き換え結果もこのLPの作り置きに入れる（ページを開くたびに置き換えない）。
    // LP・予約マスター・ショートコードを admin で保存すると bustServerMemo で消え、次の表示で作り直す。
    const renderBlocks: any[] = await memo(`${memoKey}:render`, async () => {
      if (!rawBlocks.some((b) => JSON.stringify(b?.data ?? "").includes("[["))) return rawBlocks;
      const sc = await getShortcodeContext({ preview: isPreview });
      const ap = (h: unknown) => (typeof h === "string" && h ? applyShortcodesWith(h, sc) : h);
      return rawBlocks.map((b: any) => {
        const d = b?.data;
        if (!d) return b;
        switch (b.type) {
          case "richText":
            return d.body ? { ...b, data: { ...d, body: ap(d.body) } } : b;
          case "blocknote":
          case "html":
            return d.html ? { ...b, data: { ...d, html: ap(d.html) } } : b;
          case "masterMenu":
            return d.introHtml || d.outroHtml ? { ...b, data: { ...d, introHtml: ap(d.introHtml || ""), outroHtml: ap(d.outroHtml || "") } } : b;
          case "seasonal": {
            const entries = d.entries && typeof d.entries === "object" ? d.entries : null;
            if (!entries) return b;
            const next: Record<string, any> = {};
            for (const [k, e] of Object.entries(entries as Record<string, any>)) next[k] = e && e.body ? { ...e, body: ap(e.body) } : e;
            return { ...b, data: { ...d, entries: next } };
          }
          default:
            return b;
        }
      });
    }, { fresh: isPreview });
    return (
      <>
        {isPreview && <PreviewBanner />}
        <LpBlocksRenderer blocks={renderBlocks} resolved={resolved} bookingForms={bookingForms} linked={linked} lpTitle={lp.title} slug={lp.slug} />
      </>
    );
  }

  // ===== SIMPLE（本文＋CTA・従来のオレンジ帯ヒーロー＋白カード） =====
  const simpleContent = await expandContent();
  return (
    <main className="min-h-screen bg-slate-50 pb-20 text-black">
      {isPreview && <PreviewBanner />}

      {/* ナビ */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
            <span>←</span> 公式サイト
          </Link>
          <Link href="/inquiry" className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm hover:bg-red-700 transition-colors">
            無料相談
          </Link>
        </div>
      </nav>

      {/* ヒーロー */}
      <div className="relative w-full py-16 md:py-24 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 border-b-[12px] border-yellow-400">
        {lp.heroImage && (
          <Image
            src={lp.heroImage}
            alt={lp.title}
            fill
            // ファーストビュー（LCP要素）：先読み＋最優先・遅延読み込みしない
            preload
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className="object-cover opacity-40 mix-blend-overlay"
          />
        )}
        <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto w-full">
          <h1 className="text-3xl md:text-6xl font-black leading-tight drop-shadow-lg mb-6">
            {lp.catchphrase || lp.title}
          </h1>
          {lp.subCopy && (
            <p className="inline-block bg-yellow-400 text-red-700 text-xs md:text-xl font-black px-5 py-2 rounded-full shadow-lg border-2 border-white">
              {lp.subCopy}
            </p>
          )}
        </div>
        <div className="absolute top-4 left-4 z-10">
          <span className="text-white/60 text-[10px] font-bold">{lp.title}</span>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-12 border border-slate-200">
          {simpleContent && (
            <div
              className="ql-content prose prose-slate prose-base md:prose-xl max-w-none text-slate-700 mb-16 leading-loose"
              dangerouslySetInnerHTML={{ __html: simpleContent }}
            />
          )}

          {effectiveBookingData && (
            <div id="booking" className="mb-16 scroll-mt-20">
              <LazyServicePageBooking pageTitle={lp.title} bookingData={effectiveBookingData} />
            </div>
          )}

          {lp.showBottomCta !== false && (
            <div className="bg-gradient-to-br from-red-600 to-orange-500 rounded-2xl p-6 md:p-10 text-center text-white shadow-2xl relative overflow-hidden">
              <p className="font-black text-xl md:text-2xl mb-6 text-yellow-200">
                ＼ まずはお気軽にご相談ください ／
              </p>

              <div className="mb-8 bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20 max-w-2xl mx-auto">
                <p className="text-base font-bold mb-2 text-white">お急ぎの方はお電話で（9:00-18:00）</p>
                <a href={`tel:${PHONE.replace(/-/g, "")}`} className="flex items-center justify-center gap-3 mb-4 group transition-transform hover:scale-105">
                  <span className="text-3xl md:text-4xl">📞</span>
                  <span className="text-4xl md:text-6xl font-black tracking-widest font-mono text-white">{PHONE}</span>
                </a>
                <p className="inline-block bg-yellow-400 text-red-800 font-bold px-4 py-1.5 rounded-full text-sm md:text-base">
                  ※ご相談の際は「キャンペーンページを見た」とお伝えください
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
                <a
                  href={LINE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full md:flex-1 bg-[#06C755] text-white font-black py-4 px-6 rounded-full shadow-lg hover:brightness-110 transition-all text-lg"
                >
                  <span className="text-2xl">LINE</span> で手軽に相談する
                </a>

                <Link
                  href={lp.ctaLink || "/inquiry"}
                  className="flex items-center justify-center gap-3 w-full md:flex-1 bg-yellow-400 text-red-700 font-black py-4 px-6 rounded-full shadow-lg hover:bg-yellow-500 transition-all text-lg"
                >
                  {lp.ctaText || "お見積り依頼はこちら"}
                </Link>
              </div>

              <p className="md:hidden mt-6 text-xs font-bold opacity-90 text-white">
                ※ご相談の際「キャンペーンを見た」とお伝えください
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
