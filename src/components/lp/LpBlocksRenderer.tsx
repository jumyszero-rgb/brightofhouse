// @/src/components/lp/LpBlocksRenderer.tsx
// ブロック形式LPの公開側レンダラ（フェーズ1+）
// blocks(Json配列)を上から順に描画する。価格・名称は予約マスターから解決したresolvedを参照する。
import Image from "next/image";
import PhoneLink from "@/components/PhoneLink";
import { LazyLeadForm, LazyServicePageBooking } from "@/components/lp/LazyLpForms";
import { BRAND } from "@/lib/lpContent";
import LpFoldAnchorOpener from "@/components/lp/LpFoldAnchorOpener";
import { MENU_BUTTON_DEFAULTS, type MenuButtonKey } from "@/lib/lpMenuButtons";

type MasterItem = {
  title: string;
  price: number;
  originalPrice?: number;
  from?: boolean;
  workContent?: string | null;
  recommendPoint?: string | null;
  cautionNote?: string | null;
};
export type ResolvedMaster = {
  menus: Record<string, MasterItem>;
  subMenus: Record<string, MasterItem>;
  options: Record<string, MasterItem>;
};

type Block = {
  id: string;
  type: string;
  visible?: boolean;
  data?: any;
  refs?: any;
  /** 折りたたみ表示（見出しだけ出して、タップで開く） */
  fold?: { enabled?: boolean; title?: string; open?: boolean };
};

type Props = {
  blocks: Block[];
  resolved: ResolvedMaster;
  bookingForms?: Record<string, any>; // blockId（複数大分類対応）または categoryId（旧形式） -> bookingData({mains,...})
  /** 口コミ・FAQ（サービス詳細ページと連動）・施工事例ブロック用に、サーバーで取ってきたデータ */
  linked?: LinkedData;
  lpTitle: string;
  slug: string;
};

export type LinkedData = {
  testimonials: { id: string; servicePageId: string | null; authorLabel: string; rating: number | null; body: string }[];
  faqs: { id: string; servicePageId: string; question: string; answer: string }[];
  beforeAfters: { id: string; title: string; beforeUrl: string; afterUrl: string; slug: string | null }[];
};

const yen = (n: number) => `¥${(n || 0).toLocaleString()}`;
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x) : []);
const rows = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v.filter((x) => x && typeof x === "object") as T[]) : []);

function Stars({ n = 5 }: { n?: number }) {
  return (
    <span className="text-amber-400" aria-hidden>
      {"★".repeat(Math.max(0, Math.min(5, n)))}
    </span>
  );
}

const LINE_ICON = (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 3C6.48 3 2 6.58 2 11c0 3.94 3.55 7.24 8.35 7.88.33.07.77.22.88.5.1.25.07.65.03.9l-.14.85c-.04.25-.2.98.86.53 1.06-.45 5.73-3.37 7.81-5.77C21.27 14.3 22 12.73 22 11c0-4.42-4.48-8-10-8z" />
  </svg>
);

/** リッチLPと同じ見出しの体裁 */
function SecHeading({ text, sub }: { text?: string; sub?: string }) {
  if (!text) return null;
  return (
    <>
      <h2 className={`text-center text-lg md:text-2xl font-black ${sub ? "mb-2" : "mb-6"}`}>{text}</h2>
      {sub && <p className="text-center text-xs text-slate-500 mb-6">{sub}</p>}
    </>
  );
}

function resolveOne(refType: string | undefined, refId: string | undefined, resolved: ResolvedMaster): MasterItem | null {
  if (!refType || !refId) return null;
  if (refType === "menu") return resolved.menus[refId] || null;
  if (refType === "subMenu") return resolved.subMenus[refId] || null;
  if (refType === "option") return resolved.options[refId] || null;
  return null;
}

/** メニューブロックで選ばれた項目（複数対応の refs.items を優先、旧データの refType/refId にもフォールバック） */
function resolveMasterItems(block: Block, resolved: ResolvedMaster): { key: string; item: MasterItem }[] {
  const items: { refType: string; refId: string }[] = Array.isArray(block.refs?.items) && block.refs.items.length
    ? block.refs.items
    : block.refs?.refId ? [{ refType: block.refs.refType || "menu", refId: block.refs.refId }] : [];
  const out: { key: string; item: MasterItem }[] = [];
  for (const it of items) {
    const item = resolveOne(it?.refType, it?.refId, resolved);
    if (item) out.push({ key: `${it.refType}:${it.refId}`, item });
  }
  return out;
}



function ctaHref(data: any): string {
  const t = data?.targetType;
  const v = (data?.targetValue || "").trim();
  if (t === "form") return "#lead";
  if (t === "lp") return v ? `/lp/${v}` : "/";
  if (t === "hp") return v || "/";
  return v || "#lead";
}

function HeroStars() {
  return <span className="text-amber-400" aria-hidden>★★★★★</span>;
}

/**
 * next/image で最適化できる画像か（next.config の images 設定で許可している配信元だけ）。
 *  - サイト内の画像（/images/... など・クエリなし）
 *  - R2 の公開URL（https://pub-xxxx.r2.dev/...）
 * それ以外の外部URLを next/image に渡すとエラーになるため、通常の <img> で表示する。
 */
function isOptimizableSrc(src: string): boolean {
  if (src.includes("?")) return false; // クエリ付きURLは next/image の許可設定が別途必要なので対象外
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  return /^https:\/\/pub-[^/.]+\.r2\.dev\//.test(src);
}

/**
 * ヒーロー背景画像。
 * firstView=true（ページ最上部のブロック＝LCP要素）のときは先読み＋最優先で取得し、遅延読み込みしない。
 * それ以外の位置に置かれたヒーローは遅延読み込み。
 */
function HeroBgImage({ src, firstView }: { src: string; firstView: boolean }) {
  const cls = "absolute inset-0 w-full h-full object-cover";
  if (isOptimizableSrc(src)) {
    return firstView ? (
      <Image src={src} alt="" fill sizes="100vw" preload loading="eager" fetchPriority="high" className="object-cover" />
    ) : (
      <Image src={src} alt="" fill sizes="100vw" loading="lazy" className="object-cover" />
    );
  }
  if (firstView) {
    // 最適化できない外部URLでも、遅延読み込みせず最優先で取りに行かせる
    return <img src={src} alt="" className={cls} loading="eager" fetchPriority="high" decoding="async" />;
  }
  return <img src={src} alt="" className={cls} loading="lazy" decoding="async" />;
}

export default function LpBlocksRenderer({ blocks, resolved, bookingForms, linked, lpTitle, slug }: Props) {
  const list = Array.isArray(blocks) ? blocks.filter((b) => b && b.visible !== false) : [];
  // ページ内リンクの飛び先：最初の申込フォーム＝#lead、最初のカレンダー予約＝#booking
  //  （申込フォームが無いLPでは、カレンダー予約が #lead も兼ねる＝従来のCTAボタンがそのまま使える）
  const firstLeadId = list.find((b) => b.type === "leadForm")?.id;
  const firstBookingId = list.find((b) => b.type === "bookingForm")?.id;
  const hasFold = list.some((b) => b.fold?.enabled && (b.fold?.title || "").trim());

  return (
    <main className="min-h-screen bg-white text-slate-800">
      {hasFold && <LpFoldAnchorOpener />}
      {list.map((block, index) => {
        const node = renderBlock(block, index);
        if (!node) return null;
        // 折りたたみ（見出しだけ表示・タップで開く）。ヒーローは対象外
        const fold = block.fold;
        const foldTitle = (fold?.title || "").trim();
        if (block.type !== "hero" && fold?.enabled && foldTitle) {
          return (
            <details key={block.id} open={!!fold.open} className="lp-fold group border-b border-slate-200 first:border-t">
              <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none bg-white hover:bg-slate-50">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg md:text-xl font-black text-slate-800 leading-snug">{foldTitle}</h2>
                  <span className="shrink-0 text-blue-600 text-sm font-bold transition-transform group-open:rotate-180" aria-hidden>▼</span>
                </div>
              </summary>
              {node}
            </details>
          );
        }
        return node;
      })}
    </main>
  );

  function renderBlock(block: Block, index: number) {
        const d = block.data || {};
        // ページ最上部のブロック（ファーストビュー）か
        const firstView = index === 0;
        switch (block.type) {
          case "hero": {
            const common = d.useCommon !== false;
            const ratingLabel = common ? BRAND.ratingLabel : (d.ratingLabel || BRAND.ratingLabel);
            const ratingNote = common ? BRAND.ratingNote : (d.ratingNote || "");
            const badges: string[] = common
              ? BRAND.badges
              : (Array.isArray(d.badges) ? d.badges : (typeof d.badges === "string" ? d.badges.split(",").map((s: string) => s.trim()).filter(Boolean) : BRAND.badges));
            const stats: any[] = common ? BRAND.stats : (Array.isArray(d.stats) && d.stats.length ? d.stats : BRAND.stats);
            const showStats = common ? true : d.showStats !== false;
            const note = common ? "受付 9:00〜18:00 / お見積り無料" : (d.note || "");
            const phone = common ? "0120-792-684" : (d.phone || "0120-792-684");
            const lineUrl = common ? BRAND.lineUrl : (d.lineUrl !== undefined ? d.lineUrl : BRAND.lineUrl);
            return (
              <div key={block.id}>
                <section className="relative overflow-hidden">
                  {d.imageUrl ? (
                    <>
                      <HeroBgImage src={d.imageUrl} firstView={firstView} />
                      <div className="absolute inset-0 bg-[#022047]/60" aria-hidden />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500" aria-hidden />
                  )}
                  <div className="relative z-10 max-w-3xl mx-auto px-5 pt-12 pb-10 md:pt-16 md:pb-14 text-white text-center">
                    {d.eyebrow && (
                      <p className="inline-block text-xs md:text-sm font-bold bg-white/20 rounded-full px-3 py-1 mb-4">{d.eyebrow}</p>
                    )}
                    <h1 className="text-2xl md:text-4xl font-black leading-tight mb-3 drop-shadow">{d.title || lpTitle}</h1>
                    {d.subtitle && <p className="text-sm md:text-base text-blue-50 mb-4 leading-relaxed">{d.subtitle}</p>}
                    <p className="text-sm font-bold mb-4">
                      <HeroStars /> <span className="ml-1">{ratingLabel}</span>
                      {ratingNote && <span className="text-blue-100 font-normal ml-2 text-xs">{ratingNote}</span>}
                    </p>
                    {badges.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2 mb-5">
                        {badges.map((b) => (
                          <span key={b} className="bg-white/15 border border-white/30 rounded-full px-3 py-1 text-xs font-bold">✓ {b}</span>
                        ))}
                      </div>
                    )}
                    {d.priceLead && (
                      <p className="inline-block bg-amber-400 text-slate-900 font-black text-sm md:text-lg px-4 py-2 rounded-xl mb-6 shadow">{d.priceLead}</p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <a href="#lead" className="bg-amber-400 text-slate-900 font-black px-6 py-3.5 rounded-full shadow-lg hover:bg-amber-300 transition-colors text-center">無料で相談・見積り</a>
                      {/* 0120 のときは PhoneLink（広告経由で0800に置き換え）。独自番号のときはそのまま */}
                      {phone.replace(/[^0-9]/g, "") === "0120792684" ? (
                        <PhoneLink className="bg-white text-blue-700 font-bold px-6 py-3.5 rounded-full shadow hover:bg-blue-50 transition-colors text-center" prefix="📞 " />
                      ) : (
                        <a href={`tel:${phone}`} className="bg-white text-blue-700 font-bold px-6 py-3.5 rounded-full shadow hover:bg-blue-50 transition-colors text-center">📞 {phone}</a>
                      )}
                      {lineUrl && (
                        <a href={lineUrl} className="bg-green-500 text-white font-bold px-6 py-3.5 rounded-full shadow hover:bg-green-600 transition-colors text-center">LINEで相談</a>
                      )}
                    </div>
                    {note && <p className="text-[11px] text-blue-100 mt-3">{note}</p>}
                  </div>
                </section>
                {showStats && stats.length > 0 && (
                  <section className="bg-slate-900 text-white">
                    <div className="max-w-3xl mx-auto px-5 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      {stats.map((s, i) => (
                        <div key={i}>
                          <p className="text-xl md:text-2xl font-black text-amber-400">{s.value}</p>
                          <p className="text-[11px] text-slate-300 mt-1">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            );
          }

          case "richText": {
            const boxClasses: Record<string, string> = {
              info: "bg-blue-50 border border-blue-200",
              warning: "bg-red-50 border border-red-200",
              highlight: "bg-amber-50 border border-amber-300",
              card: "bg-white border-2 border-slate-200 shadow-sm",
              green: "bg-emerald-50 border border-emerald-200",
            };
            const box = d.boxStyle && d.boxStyle !== "none" ? (boxClasses[d.boxStyle] || "") : "";
            const bodyEl = d.body ? (d.collapsible ? (
              <details>
                <summary className="cursor-pointer text-blue-700 font-bold text-sm mb-2">{d.summaryLabel || "詳しく見る"} ▼</summary>
                <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed mt-3" dangerouslySetInnerHTML={{ __html: d.body }} />
              </details>
            ) : (
              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: d.body }} />
            )) : null;
            return (
              <section key={block.id} className="py-8">
                <div className="max-w-3xl mx-auto px-4">
                  {box ? (
                    <div className={`rounded-2xl p-5 md:p-6 ${box}`}>
                      {d.heading && <h2 className="text-lg md:text-xl font-black text-slate-800 mb-3">{d.heading}</h2>}
                      {bodyEl}
                    </div>
                  ) : (
                    <>
                      {d.heading && <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-4 text-center">{d.heading}</h2>}
                      {bodyEl}
                    </>
                  )}
                </div>
              </section>
            );
          }

          case "image":
            return (
              <section key={block.id} className="py-8">
                <div className="max-w-3xl mx-auto px-4 text-center">
                  {d.imageUrl && (
                    <img
                      src={d.imageUrl}
                      alt={d.caption || ""}
                      className="w-full rounded-2xl shadow"
                      // 最上部に置かれた時だけ最優先、それ以外は画面に近づいてから読み込む
                      loading={firstView ? "eager" : "lazy"}
                      fetchPriority={firstView ? "high" : "auto"}
                      decoding="async"
                    />
                  )}
                  {d.caption && <p className="text-xs text-slate-500 mt-2">{d.caption}</p>}
                </div>
              </section>
            );

          case "masterMenu": {
            const items = resolveMasterItems(block, resolved);
            const btn = (d.buttons || {}) as Partial<Record<MenuButtonKey, { show?: boolean; label?: string }>>;
            const label = (k: MenuButtonKey) => (btn[k]?.label || "").trim() || MENU_BUTTON_DEFAULTS[k];
            // 飛び先のブロックが無いボタンは出さない
            const showLead = !!btn.lead?.show && !!firstLeadId;
            const showBooking = !!btn.booking?.show && !!firstBookingId;
            const showPhone = !!btn.phone?.show;
            const showLine = !!btn.line?.show && !!BRAND.lineUrl;
            const anyButton = showLead || showBooking || showPhone || showLine;
            const btnBase = "flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-full font-black text-base shadow-sm transition-colors text-center";
            return (
              <section key={block.id} className="py-8">
                <div className="max-w-3xl mx-auto px-4">
                  {d.heading && <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-4 text-center">{d.heading}</h2>}
                  {d.introHtml && (
                    <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed mb-5" dangerouslySetInnerHTML={{ __html: d.introHtml }} />
                  )}
                  {items.length > 0 ? (
                    <div className="space-y-3">
                      {items.map(({ key, item }) => (
                        <div key={key} className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
                          <div className="flex justify-between items-baseline gap-3 flex-wrap">
                            <span className="font-bold text-slate-800 text-lg">{item.title}</span>
                            <span className="whitespace-nowrap text-right">
                              {item.originalPrice != null && item.originalPrice !== item.price && (
                                <span className="text-xs text-slate-400 line-through mr-1.5">{yen(item.originalPrice)}</span>
                              )}
                              <span className="font-black text-blue-700 text-2xl">{yen(item.price)}</span>
                              {item.from && <span className="font-black text-blue-700 text-base">〜</span>}
                              <span className="text-[11px] text-slate-500 ml-1">（税込）</span>
                            </span>
                          </div>
                          {d.showDesc !== false && (
                            <>
                              {item.recommendPoint && (
                                <p className="text-sm font-bold text-slate-700 mt-3 whitespace-pre-wrap leading-relaxed">{item.recommendPoint}</p>
                              )}
                              {item.workContent && (
                                <details className="mt-2">
                                  <summary className="cursor-pointer text-sm font-bold text-blue-700">作業内容 ▼</summary>
                                  <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed">{item.workContent}</p>
                                </details>
                              )}
                              {item.cautionNote && (
                                <details className="mt-2">
                                  <summary className="cursor-pointer text-sm font-bold text-amber-700">⚠️ 注意事項 ▼</summary>
                                  <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed">{item.cautionNote}</p>
                                </details>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">※メニュー未設定、または予約マスターに該当項目がありません。</div>
                  )}
                  {d.outroHtml && (
                    <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed mt-5" dangerouslySetInnerHTML={{ __html: d.outroHtml }} />
                  )}
                  {anyButton && (
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {showLead && (
                        <a href="#lead" className={`${btnBase} bg-red-600 text-white hover:bg-red-700`}>{label("lead")}</a>
                      )}
                      {showBooking && (
                        <a href="#booking" className={`${btnBase} bg-blue-600 text-white hover:bg-blue-700`}>📅 {label("booking")}</a>
                      )}
                      {showLine && (
                        <a href={BRAND.lineUrl} target="_blank" rel="noopener noreferrer" className={`${btnBase} bg-[#06C755] text-white hover:brightness-95`}>
                          {label("line")}
                        </a>
                      )}
                      {showPhone && (
                        <PhoneLink className={`${btnBase} bg-white text-blue-700 border-2 border-blue-600 hover:bg-blue-50`} prefix="📞 " display={label("phone")} />
                      )}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          case "cta":
            return (
              <section key={block.id} className="py-8">
                <div className="max-w-3xl mx-auto px-4 text-center">
                  <a href={ctaHref(d)} className="inline-block bg-red-600 text-white font-black px-10 py-4 rounded-full shadow-lg hover:bg-red-700 transition-all text-lg">
                    {d.label || "お問い合わせはこちら"}
                  </a>
                </div>
              </section>
            );

          case "leadForm":
            return (
              <section key={block.id} id={block.id === firstLeadId ? "lead" : undefined} className="py-12 bg-slate-50 scroll-mt-16">
                <div className="max-w-2xl mx-auto px-4">
                  {d.heading && <h2 className="text-2xl font-black text-center text-slate-800 mb-2">{d.heading}</h2>}
                  {d.note && <p className="text-center text-sm text-slate-500 mb-6">{d.note}</p>}
                  <LazyLeadForm service={lpTitle} source={slug} />
                </div>
              </section>
            );

          case "bookingForm": {
            const bd = bookingForms?.[block.id] ?? bookingForms?.[block.refs?.refId];
            return (
              <section key={block.id} id={block.id === firstBookingId ? "booking" : undefined} className="py-12 bg-slate-50 scroll-mt-16">
                {/* 申込フォームが無いLPでは、従来の #lead（CTAボタン等）もここへ飛ぶ */}
                {!firstLeadId && block.id === firstBookingId && <span id="lead" className="block scroll-mt-16" aria-hidden />}
                <div className="max-w-5xl mx-auto px-4">
                  {d.heading && <h2 className="text-2xl font-black text-center text-slate-800 mb-6">{d.heading}</h2>}
                  {bd ? (
                    <LazyServicePageBooking pageTitle={lpTitle} bookingData={bd} />
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 text-center">※予約カテゴリ未設定です。ブロック編集で大分類を選択してください。</div>
                  )}
                </div>
              </section>
            );
          }

          case "seasonal": {
            const entries = d.entries || {};
            const monthNow = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", month: "numeric" }).format(new Date()));
            const filled = (e: any) => e && (e.heading || e.body || e.badge);
            let entry = entries[String(monthNow)];
            if (!filled(entry)) {
              for (let i = 1; i < 12; i++) {
                const m = ((monthNow - 1 - i + 12) % 12) + 1;
                if (filled(entries[String(m)])) { entry = entries[String(m)]; break; }
              }
            }
            if (!filled(entry)) return null;
            return (
              <section key={block.id} className="py-10 bg-gradient-to-br from-orange-50 to-amber-100">
                <div className="max-w-3xl mx-auto px-4">
                  <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm p-6">
                    {entry.badge && <span className="inline-block bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full mb-3">{entry.badge}</span>}
                    {entry.heading && <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-3">{entry.heading}</h2>}
                    {entry.body && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-700 font-bold text-sm">詳しく見る ▼</summary>
                        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed mt-3" dangerouslySetInnerHTML={{ __html: entry.body }} />
                      </details>
                    )}
                    <div className="mt-5 text-center">
                      <a href="#lead" className="inline-block bg-red-600 text-white font-black px-8 py-3 rounded-full shadow hover:bg-red-700 transition-all">今の時期のご相談はこちら</a>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          case "blocknote": {
            const html = d?.html || "";
            if (!html) return null;
            return (
              <section key={block.id} className="py-8">
                <div className="max-w-3xl mx-auto px-4">
                  <div
                    className="bn-content prose prose-slate max-w-none [&_.bn-block-column-list]:gap-4 [&_.bn-block-column-list]:items-start [&_.bn-block-content]:my-2"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                </div>
              </section>
            );
          }

          case "html": {
            const html = d?.html || "";
            if (!html) return null;
            const full = d?.fullWidth === true;
            return (
              <section key={block.id} className={full ? "" : "py-8"}>
                {full ? (
                  <div className="lp-html-block" dangerouslySetInnerHTML={{ __html: html }} />
                ) : (
                  <div className="max-w-3xl mx-auto px-4">
                    <div className="lp-html-block" dangerouslySetInnerHTML={{ __html: html }} />
                  </div>
                )}
              </section>
            );
          }

          // ===== ここから：リッチLPに近いブロック =====
          case "pains": {
            const items = strArr(d.items);
            if (!items.length) return null;
            const ctaHrefPains = firstLeadId ? "#lead" : firstBookingId ? "#booking" : "";
            return (
              <section key={block.id} className="py-12">
                <div className="max-w-3xl mx-auto px-5">
                  <SecHeading text={d.heading ?? "こんなお悩みありませんか？"} />
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">
                        <span className="text-blue-600 font-black">✓</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  {d.showCta !== false && (BRAND.lineUrl || ctaHrefPains) && (
                    <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl p-5 md:p-6 max-w-md mx-auto">
                      <p className="text-center font-black text-base md:text-lg mb-4 leading-snug whitespace-pre-line">
                        {d.ctaTitle || "その汚れ、写真を送るだけで\n料金がわかります"}
                      </p>
                      {BRAND.lineUrl && (
                        <>
                          <a href={BRAND.lineUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#06c755] text-white font-black text-[15px] md:text-lg px-4 py-4 rounded-full shadow-lg hover:brightness-105 transition">
                            {LINE_ICON}
                            <span className="leading-snug">LINEで写真を送る</span>
                          </a>
                          <p className="text-[11px] mt-1.5 text-center text-slate-500">お名前・住所の入力は不要です</p>
                        </>
                      )}
                      {ctaHrefPains && (
                        <a href={ctaHrefPains} className="mt-3 flex items-center justify-center bg-amber-400 text-slate-900 font-black px-5 py-3.5 rounded-full shadow hover:bg-amber-300 transition-colors">
                          無料相談・予約はこちら →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          case "reasons": {
            const items = rows<{ title?: string; body?: string }>(d.items).filter((r) => r.title || r.body);
            if (!items.length) return null;
            return (
              <section key={block.id} className="py-12">
                <div className="max-w-3xl mx-auto px-5">
                  <SecHeading text={d.heading ?? "選ばれる理由"} />
                  <div className="space-y-3">
                    {items.map((r, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 flex gap-4 shadow-sm">
                        <span className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm">{i + 1}</span>
                        <div>
                          {r.title && <p className="font-bold mb-1">{r.title}</p>}
                          {r.body && <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{r.body}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          case "steps": {
            const own = rows<{ t?: string; d?: string }>(d.items).filter((x) => x.t || x.d);
            const items = own.length ? own : BRAND.steps;
            return (
              <section key={block.id} className="py-12">
                <div className="max-w-3xl mx-auto px-5">
                  <SecHeading text={d.heading ?? "ご利用の流れ"} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((x, i) => (
                      <div key={i} className="bg-sky-50 border border-sky-100 rounded-xl p-4">
                        <p className="font-bold text-blue-700 text-sm mb-1">
                          <span className="inline-flex w-6 h-6 rounded-full bg-blue-600 text-white text-xs items-center justify-center mr-2">{i + 1}</span>
                          {x.t}
                        </p>
                        {x.d && <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{x.d}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          case "recommended": {
            const items = rows<{ badge?: string; name?: string; note?: string; price?: string }>(d.items).filter((x) => x.name);
            if (!items.length) return null;
            const href = firstLeadId ? "#lead" : firstBookingId ? "#booking" : "";
            return (
              <section key={block.id} className="py-12">
                <div className="max-w-3xl mx-auto px-5">
                  <SecHeading text={d.heading ?? "おすすめ人気メニュー"} sub={d.sub ?? "ご依頼の多い人気のメニューです"} />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {items.map((r, i) => (
                      <div key={i} className="relative bg-white border-2 border-amber-300 rounded-2xl p-5 pt-6 shadow-md text-center">
                        {r.badge && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full whitespace-nowrap">{r.badge}</span>
                        )}
                        <p className="font-bold text-base">{r.name}</p>
                        {r.note && <p className="text-xs text-slate-500 mt-1">{r.note}</p>}
                        {r.price && <p className="text-2xl font-black text-red-600 mt-3">{r.price}</p>}
                        {href && (
                          <a href={href} className="mt-4 inline-block bg-blue-600 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors">これで相談する</a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          case "voices": {
            const pageIds = strArr(d.servicePageIds);
            const fromPages = pageIds.flatMap((pid) =>
              (linked?.testimonials || []).filter((t) => t.servicePageId === pid).map((t) => ({ text: t.body, who: t.authorLabel, stars: t.rating ?? 5 }))
            );
            const manual = rows<{ text?: string; who?: string; stars?: number }>(d.items).filter((v) => v.text);
            const limit = Number(d.limit) > 0 ? Number(d.limit) : 0;
            const all = [...fromPages, ...manual.map((v) => ({ text: v.text!, who: v.who || "", stars: Number(v.stars) || 5 }))];
            const items = limit ? all.slice(0, limit) : all;
            if (!items.length) return null;
            return (
              <section key={block.id} className="py-12">
                <div className="max-w-3xl mx-auto px-5">
                  <SecHeading text={d.heading ?? "お客様の声"} sub={d.showRating !== false ? `${BRAND.ratingLabel}（${BRAND.ratingNote}）` : undefined} />
                  <div className="space-y-3">
                    {items.map((v, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <p className="mb-1"><Stars n={v.stars} /></p>
                        <p className="text-sm leading-relaxed whitespace-pre-line">「{v.text}」</p>
                        {v.who && <p className="text-xs text-slate-500 mt-2 text-right">— {v.who}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          case "faq": {
            const pageIds = strArr(d.servicePageIds);
            const fromPages = pageIds.flatMap((pid) =>
              (linked?.faqs || []).filter((f) => f.servicePageId === pid).map((f) => ({ q: f.question, a: f.answer }))
            );
            const manual = rows<{ q?: string; a?: string }>(d.items).filter((f) => f.q && f.a).map((f) => ({ q: f.q!, a: f.a! }));
            const items = [...fromPages, ...manual];
            if (!items.length) return null;
            return (
              <section key={block.id} className="py-12">
                <div className="max-w-3xl mx-auto px-5">
                  <SecHeading text={d.heading ?? "よくあるご質問"} />
                  <div className="space-y-3">
                    {items.map((f, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <p className="font-bold text-sm md:text-base mb-2">Q. {f.q}</p>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">A. {f.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          case "beforeAfter": {
            const byId = new Map((linked?.beforeAfters || []).map((b) => [b.id, b]));
            const photos = strArr(d.ids).map((id) => byId.get(id)).filter((x): x is NonNullable<typeof x> => !!x);
            if (!photos.length) return null;
            const big = photos.length === 1;
            const imgH = big ? "h-64 md:h-96" : "h-36";
            const imgSizes = big ? "(max-width:768px) 50vw, 384px" : "(max-width:640px) 50vw, 25vw";
            const Img = ({ src, alt }: { src: string; alt: string }) =>
              isOptimizableSrc(src) ? (
                <Image src={src} alt={alt} fill sizes={imgSizes} className="object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={alt} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
              );
            return (
              <section key={block.id} className="py-12">
                <div className="max-w-3xl mx-auto px-5">
                  <SecHeading text={d.heading ?? "施工事例（札幌の実績）"} />
                  <div className={big ? "grid grid-cols-1" : "grid grid-cols-1 sm:grid-cols-2 gap-5"}>
                    {photos.map((p) => (
                      <div key={p.id} className={`border border-slate-200 rounded-xl overflow-hidden ${big ? "max-w-2xl mx-auto w-full" : ""}`}>
                        <div className="grid grid-cols-2">
                          <div>
                            <p className="text-[11px] font-bold text-center bg-slate-100 py-1">Before</p>
                            <div className={`relative w-full ${imgH}`}><Img src={p.beforeUrl} alt="作業前" /></div>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-center bg-blue-600 text-white py-1">After</p>
                            <div className={`relative w-full ${imgH}`}><Img src={p.afterUrl} alt="作業後" /></div>
                          </div>
                        </div>
                        {(p.title || p.slug) && (
                          <div className="p-3 flex items-center justify-between gap-2">
                            {p.title && <p className="text-sm text-slate-600">{p.title}</p>}
                            {p.slug && (
                              <a href={`/before-after/${p.slug}`} className="shrink-0 text-xs font-bold text-blue-600 hover:underline">詳しく見る →</a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          case "assurance": {
            const showA = d.showAssurance !== false;
            const showArea = d.showArea !== false;
            if (!showA && !showArea) return null;
            return (
              <section key={block.id} className="py-12">
                <div className="max-w-3xl mx-auto px-5 space-y-12">
                  {showA && (
                    <div>
                      <SecHeading text={d.assuranceHeading ?? "安心の理由"} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {BRAND.assurances.map((a) => (
                          <div key={a.title} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                            <p className="font-bold text-sm mb-1 flex items-center gap-2"><span className="text-blue-600">●</span>{a.title}</p>
                            <p className="text-xs text-slate-600 leading-relaxed">{a.body}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {showArea && (
                    <div>
                      <SecHeading text={d.areaHeading ?? "対応エリア"} />
                      <p className="text-center text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-5">
                        {BRAND.area}
                        <br />
                        <span className="text-xs text-slate-500">エリア外でもご相談ください。お問い合わせ時にご確認いたします。</span>
                      </p>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          default:
            return null;
        }
  }
}
