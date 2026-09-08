// @/src/components/lp/LpBlocksRenderer.tsx
// ブロック形式LPの公開側レンダラ（フェーズ1+）
// blocks(Json配列)を上から順に描画する。価格・名称は予約マスターから解決したresolvedを参照する。
import LeadForm from "@/components/lp/LeadForm";
import ServicePageBooking from "@/components/booking/ServicePageBooking";
import { BRAND } from "@/lib/lpContent";

type MasterItem = { title: string; price: number; workContent?: string | null };
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
};

type Props = {
  blocks: Block[];
  resolved: ResolvedMaster;
  bookingForms?: Record<string, any>; // categoryId -> bookingData({mains,...})
  lpTitle: string;
  slug: string;
};

const yen = (n: number) => `¥${(n || 0).toLocaleString()}`;

function resolveMaster(block: Block, resolved: ResolvedMaster): MasterItem | null {
  const refType = block.refs?.refType;
  const refId = block.refs?.refId;
  if (!refType || !refId) return null;
  if (refType === "menu") return resolved.menus[refId] || null;
  if (refType === "subMenu") return resolved.subMenus[refId] || null;
  if (refType === "option") return resolved.options[refId] || null;
  return null;
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

export default function LpBlocksRenderer({ blocks, resolved, bookingForms, lpTitle, slug }: Props) {
  const list = Array.isArray(blocks) ? blocks.filter((b) => b && b.visible !== false) : [];

  return (
    <main className="min-h-screen bg-white text-slate-800">
      {list.map((block) => {
        const d = block.data || {};
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
                      <img src={d.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
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
                      <a href={`tel:${phone}`} className="bg-white text-blue-700 font-bold px-6 py-3.5 rounded-full shadow hover:bg-blue-50 transition-colors text-center">📞 {phone}</a>
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
                  {d.imageUrl && <img src={d.imageUrl} alt={d.caption || ""} className="w-full rounded-2xl shadow" />}
                  {d.caption && <p className="text-xs text-slate-500 mt-2">{d.caption}</p>}
                </div>
              </section>
            );

          case "masterMenu": {
            const item = resolveMaster(block, resolved);
            return (
              <section key={block.id} className="py-6">
                <div className="max-w-3xl mx-auto px-4">
                  {item ? (
                    <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex justify-between items-baseline gap-3">
                        <span className="font-bold text-slate-800 text-lg">{item.title}</span>
                        <span className="font-black text-blue-700 text-2xl whitespace-nowrap">{yen(item.price)}</span>
                      </div>
                      {d.showDesc && item.workContent && (
                        <p className="text-sm text-slate-600 mt-3 whitespace-pre-wrap leading-relaxed">{item.workContent}</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">※メニュー未設定、または予約マスターに該当項目がありません。</div>
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
              <section key={block.id} id="lead" className="py-12 bg-slate-50 scroll-mt-16">
                <div className="max-w-2xl mx-auto px-4">
                  {d.heading && <h2 className="text-2xl font-black text-center text-slate-800 mb-2">{d.heading}</h2>}
                  {d.note && <p className="text-center text-sm text-slate-500 mb-6">{d.note}</p>}
                  <LeadForm service={lpTitle} source={slug} />
                </div>
              </section>
            );

          case "bookingForm": {
            const bd = bookingForms?.[block.refs?.refId];
            return (
              <section key={block.id} id="lead" className="py-12 bg-slate-50 scroll-mt-16">
                <div className="max-w-5xl mx-auto px-4">
                  {d.heading && <h2 className="text-2xl font-black text-center text-slate-800 mb-6">{d.heading}</h2>}
                  {bd ? (
                    <ServicePageBooking pageTitle={lpTitle} bookingData={bd} />
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

          default:
            return null;
        }
      })}
    </main>
  );
}
