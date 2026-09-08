// @/src/components/lp/LpBlocksRenderer.tsx
// ブロック形式LPの公開側レンダラ（フェーズ1）
// blocks(Json配列)を上から順に描画する。価格・名称は予約マスターから解決したresolvedを参照する。
import LeadForm from "@/components/lp/LeadForm";

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

export default function LpBlocksRenderer({ blocks, resolved, lpTitle, slug }: Props) {
  const list = Array.isArray(blocks) ? blocks.filter((b) => b && b.visible !== false) : [];

  return (
    <main className="min-h-screen bg-white text-slate-800">
      {list.map((block) => {
        const d = block.data || {};
        switch (block.type) {
          case "hero":
            return (
              <section key={block.id} className="relative overflow-hidden bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 text-white">
                {d.imageUrl && (
                  <img src={d.imageUrl} alt={d.title || lpTitle} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" />
                )}
                <div className="relative z-10 max-w-3xl mx-auto px-4 py-16 md:py-24 text-center">
                  {d.eyebrow && <p className="inline-block bg-white/20 rounded-full px-4 py-1 text-xs md:text-sm font-bold mb-4">{d.eyebrow}</p>}
                  <h1 className="text-3xl md:text-5xl font-black leading-tight drop-shadow mb-4">{d.title || lpTitle}</h1>
                  {d.subtitle && <p className="text-sm md:text-lg text-white/90 mb-4 leading-relaxed">{d.subtitle}</p>}
                  {d.priceLead && (
                    <p className="inline-block bg-yellow-400 text-red-700 text-base md:text-2xl font-black px-5 py-2 rounded-full shadow-lg border-2 border-white">{d.priceLead}</p>
                  )}
                  <div className="mt-6">
                    <a href="#lead" className="inline-block bg-white text-red-600 font-black px-8 py-3 rounded-full shadow-lg hover:bg-red-50 transition-all">無料で相談する</a>
                  </div>
                </div>
              </section>
            );

          case "richText":
            return (
              <section key={block.id} className="py-10">
                <div className="max-w-3xl mx-auto px-4">
                  {d.heading && <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-4 text-center">{d.heading}</h2>}
                  {d.body && (
                    <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: d.body }} />
                  )}
                </div>
              </section>
            );

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

          default:
            return null;
        }
      })}
    </main>
  );
}
