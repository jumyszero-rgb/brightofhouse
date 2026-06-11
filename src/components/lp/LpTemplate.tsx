// @/src/components/lp/LpTemplate.tsx
import Image from "next/image";
import LeadForm from "@/components/lp/LeadForm";
import { BRAND, type LpContent } from "@/lib/lpContent";

function Stars({ n = 5 }: { n?: number }) {
  return (
    <span className="text-amber-400" aria-hidden>
      {"★".repeat(Math.max(0, Math.min(5, n)))}
    </span>
  );
}

function CtaButtons({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 justify-center ${compact ? "" : ""}`}>
      <a
        href="#lead"
        className="bg-amber-400 text-slate-900 font-black px-6 py-3.5 rounded-full shadow-lg hover:bg-amber-300 transition-colors text-center"
      >
        無料で相談・見積り
      </a>
      <a
        href="tel:0120-792-684"
        className="bg-white text-blue-700 font-bold px-6 py-3.5 rounded-full border-2 border-white/0 shadow hover:bg-blue-50 transition-colors text-center"
      >
        📞 0120-792-684
      </a>
      {BRAND.lineUrl && (
        <a
          href={BRAND.lineUrl}
          className="bg-green-500 text-white font-bold px-6 py-3.5 rounded-full shadow hover:bg-green-600 transition-colors text-center"
        >
          LINEで相談
        </a>
      )}
    </div>
  );
}

function SectionCta({ label = "この内容で無料相談する" }: { label?: string }) {
  return (
    <div className="text-center mt-7">
      <a
        href="#lead"
        className="inline-block bg-blue-600 text-white font-black px-8 py-3.5 rounded-full shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
      >
        {label} →
      </a>
    </div>
  );
}

/**
 * リッチ版 LP共通テンプレート。content（lpContent.ts）を渡すと1枚を描画。
 * FAQ・お悩み等は <details> で隠さず常時表示（Google拾い漏れ＆UX対策）。
 */
export default function LpTemplate({ content }: { content: LpContent }) {
  const { hero, pains, menu, reasons, faq, voices, photos, recommended, serviceLabel, slug } =
    content;

  return (
    <div className="bg-white text-slate-800 min-h-screen">
      {/* ===== ヒーロー ===== */}
      <section className="relative overflow-hidden">
        {hero.image ? (
          <>
            <Image
              src={hero.image}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            {/* 白文字を読ませるための暗いオーバーレイ（濃さは /60 を調整） */}
            <div className="absolute inset-0 bg-[#022047]/60" aria-hidden />
          </>
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500"
            aria-hidden
          />
        )}
        <div className="relative z-10 max-w-3xl mx-auto px-5 pt-12 pb-10 md:pt-16 md:pb-14 text-white text-center">
          <p className="inline-block text-xs md:text-sm font-bold bg-white/20 rounded-full px-3 py-1 mb-4">
            {hero.eyebrow}
          </p>
          <h1 className="text-2xl md:text-4xl font-black leading-tight mb-3 drop-shadow">
            {hero.title}
          </h1>
          <p className="text-sm md:text-base text-blue-50 mb-4 leading-relaxed">
            {hero.subtitle}
          </p>

          {/* 評価 */}
          <p className="text-sm font-bold mb-4">
            <Stars n={5} /> <span className="ml-1">{BRAND.ratingLabel}</span>
            <span className="text-blue-100 font-normal ml-2 text-xs">
              {BRAND.ratingNote}
            </span>
          </p>

          {/* 信頼バッジ */}
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            {BRAND.badges.map((b) => (
              <span
                key={b}
                className="bg-white/15 border border-white/30 rounded-full px-3 py-1 text-xs font-bold"
              >
                ✓ {b}
              </span>
            ))}
          </div>

          {hero.priceLead && (
            <p className="inline-block bg-amber-400 text-slate-900 font-black text-sm md:text-lg px-4 py-2 rounded-xl mb-6 shadow">
              {hero.priceLead}
            </p>
          )}

          <CtaButtons />
          <p className="text-[11px] text-blue-100 mt-3">受付 9:00〜18:00 / お見積り無料</p>
        </div>
      </section>

      {/* ===== 実績の数字バー ===== */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-5 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {BRAND.stats.map((s) => (
            <div key={s.label}>
              <p className="text-xl md:text-2xl font-black text-amber-400">{s.value}</p>
              <p className="text-[11px] text-slate-300 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-5">
        {/* ===== おすすめ人気メニュー ===== */}
        {recommended && recommended.length > 0 && (
          <section className="py-12">
            <h2 className="text-center text-lg md:text-2xl font-black mb-2">
              おすすめ人気メニュー
            </h2>
            <p className="text-center text-xs text-slate-500 mb-8">
              ご依頼の多い人気のメニューです
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {recommended.map((r, i) => (
                <div
                  key={i}
                  className="relative bg-white border-2 border-amber-300 rounded-2xl p-5 pt-6 shadow-md text-center"
                >
                  {r.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full whitespace-nowrap">
                      {r.badge}
                    </span>
                  )}
                  <p className="font-bold text-base">{r.name}</p>
                  {r.note && <p className="text-xs text-slate-500 mt-1">{r.note}</p>}
                  {r.price && (
                    <p className="text-2xl font-black text-red-600 mt-3">{r.price}</p>
                  )}
                  <a
                    href="#lead"
                    className="mt-4 inline-block bg-blue-600 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    これで相談する
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== お悩み ===== */}
        <section className="py-12">
          <h2 className="text-center text-lg md:text-2xl font-black mb-6">
            こんなお悩みありませんか？
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pains.map((p) => (
              <li
                key={p}
                className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm"
              >
                <span className="text-blue-600 font-black">✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <p className="text-center text-sm text-slate-600 mt-6 font-bold">
            その汚れ、札幌のプロにお任せください。
          </p>
        </section>

        {/* ===== メニュー・料金（キャンペーン） ===== */}
        <section className="py-12">
          {menu.campaignBadge && (
            <p className="text-center mb-3">
              <span className="inline-block bg-red-500 text-white text-xs md:text-sm font-black px-4 py-1.5 rounded-full">
                🎉 {menu.campaignBadge}
              </span>
            </p>
          )}
          <h2 className="text-center text-lg md:text-2xl font-black mb-3">
            メニュー・料金
          </h2>
          {menu.intro && (
            <p className="text-center text-sm text-slate-600 mb-6 whitespace-pre-line">
              {menu.intro}
            </p>
          )}
          <div className="space-y-3">
            {menu.items.map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
              >
                <div>
                  <p className="font-bold text-sm md:text-base">{m.name}</p>
                  {m.note && <p className="text-xs text-slate-500 mt-0.5">{m.note}</p>}
                </div>
                <div className="text-right ml-3 whitespace-nowrap">
                  {m.compare && (
                    <p className="text-[11px] text-slate-400 line-through">{m.compare}</p>
                  )}
                  <p className="font-black text-red-600 text-base md:text-lg">
                    {m.price || "お見積り"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* オプション・追加メニュー（任意） */}
          {menu.options && menu.options.length > 0 && (
            <div className="mt-5">
              <p className="font-bold text-sm mb-2 flex items-center gap-2 text-indigo-700">
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">
                  オプション
                </span>
                追加メニュー
              </p>
              <div className="space-y-2">
                {menu.options.map((o, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-indigo-50/60 border border-indigo-100 rounded-xl p-3"
                  >
                    <div>
                      <p className="font-bold text-sm">{o.name}</p>
                      {o.note && <p className="text-xs text-slate-500 mt-0.5">{o.note}</p>}
                    </div>
                    <p className="font-black text-indigo-700 text-sm whitespace-nowrap ml-3">
                      +{o.price || "お見積り"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 料金に含まれる基本作業（任意） */}
          {menu.baseWork && menu.baseWork.length > 0 && (
            <div className="mt-5 bg-sky-50 border border-sky-100 rounded-xl p-5">
              <p className="font-bold text-sm text-blue-700 mb-3">
                この料金に含まれる基本作業
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {menu.baseWork.map((raw, i) => {
                  const w =
                    typeof raw === "string" ? { text: raw, type: "check" as const } : raw;
                  const t = w.type || "check";
                  const mark = t === "caution" ? "⚠️" : t === "info" ? "💬" : "✓";
                  const markColor =
                    t === "caution"
                      ? "text-red-500"
                      : t === "info"
                      ? "text-slate-400"
                      : "text-blue-600";
                  const textColor = t === "caution" ? "text-red-700" : "text-slate-700";
                  const span = t !== "check" ? "sm:col-span-2" : "";
                  return (
                    <li
                      key={i}
                      className={`flex items-start gap-2 text-sm ${textColor} ${span}`}
                    >
                      <span className={`font-black ${markColor}`}>{mark}</span>
                      <span>{w.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {menu.setNote && (
            <p className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs md:text-sm text-amber-800 text-center font-bold whitespace-pre-line">
              {menu.setNote}
            </p>
          )}
          <p className="text-center text-[11px] text-slate-400 mt-3">
            ※表示は税込のWEB限定価格です。汚れ具合・広さにより変わる場合は事前に無料お見積りします。
          </p>
          <SectionCta />
        </section>

        {/* ===== before / after 写真 ===== */}
        {photos && photos.length > 0 && (
          <section className="py-12">
            <h2 className="text-center text-lg md:text-2xl font-black mb-6">
              施工事例（札幌の実績）
            </h2>
            <div
              className={
                photos.length === 1
                  ? "grid grid-cols-1"
                  : "grid grid-cols-1 sm:grid-cols-2 gap-5"
              }
            >
              {photos.map((p, i) => {
                const big = photos.length === 1;
                const imgH = big ? "h-64 md:h-96" : "h-36";
                const imgSizes = big
                  ? "(max-width:768px) 50vw, 384px"
                  : "(max-width:640px) 50vw, 25vw";
                return (
                  <div
                    key={i}
                    className={`border border-slate-200 rounded-xl overflow-hidden ${
                      big ? "max-w-2xl mx-auto w-full" : ""
                    }`}
                  >
                    <div className="grid grid-cols-2">
                      <div>
                        <p className="text-[11px] font-bold text-center bg-slate-100 py-1">
                          Before
                        </p>
                        <div className={`relative w-full ${imgH}`}>
                          <Image
                            src={p.before}
                            alt="作業前"
                            fill
                            sizes={imgSizes}
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-center bg-blue-600 text-white py-1">
                          After
                        </p>
                        <div className={`relative w-full ${imgH}`}>
                          <Image
                            src={p.after}
                            alt="作業後"
                            fill
                            sizes={imgSizes}
                            className="object-cover"
                          />
                        </div>
                      </div>
                    </div>
                    {p.caption && (
                      <p className="text-sm text-slate-600 p-3">{p.caption}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <SectionCta />
          </section>
        )}

        {/* ===== 選ばれる理由 ===== */}
        <section className="py-12">
          <h2 className="text-center text-lg md:text-2xl font-black mb-6">
            選ばれる理由
          </h2>
          <div className="space-y-3">
            {reasons.map((r, i) => (
              <div
                key={r.title}
                className="bg-white border border-slate-200 rounded-xl p-5 flex gap-4 shadow-sm"
              >
                <span className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm">
                  {i + 1}
                </span>
                <div>
                  <p className="font-bold mb-1">{r.title}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 作業の流れ ===== */}
        <section className="py-12">
          <h2 className="text-center text-lg md:text-2xl font-black mb-6">ご利用の流れ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BRAND.steps.map((s, i) => (
              <div key={s.t} className="bg-sky-50 border border-sky-100 rounded-xl p-4">
                <p className="font-bold text-blue-700 text-sm mb-1">
                  <span className="inline-flex w-6 h-6 rounded-full bg-blue-600 text-white text-xs items-center justify-center mr-2">
                    {i + 1}
                  </span>
                  {s.t}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== お客様の声 ===== */}
        {voices && voices.length > 0 && (
          <section className="py-12">
            <h2 className="text-center text-lg md:text-2xl font-black mb-2">お客様の声</h2>
            <p className="text-center text-xs text-slate-500 mb-6">
              {BRAND.ratingLabel}（{BRAND.ratingNote}）
            </p>
            <div className="space-y-3">
              {voices.map((v, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <p className="mb-1">
                    <Stars n={v.stars ?? 5} />
                  </p>
                  <p className="text-sm leading-relaxed">「{v.text}」</p>
                  <p className="text-xs text-slate-500 mt-2 text-right">— {v.who}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== 安心・保証 ===== */}
        <section className="py-12">
          <h2 className="text-center text-lg md:text-2xl font-black mb-6">安心の理由</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BRAND.assurances.map((a) => (
              <div key={a.title} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <p className="font-bold text-sm mb-1 flex items-center gap-2">
                  <span className="text-blue-600">●</span>
                  {a.title}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">{a.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 対応エリア ===== */}
        <section className="py-12">
          <h2 className="text-center text-lg md:text-2xl font-black mb-4">対応エリア</h2>
          <p className="text-center text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-5">
            {BRAND.area}
            <br />
            <span className="text-xs text-slate-500">
              エリア外でもご相談ください。お問い合わせ時にご確認いたします。
            </span>
          </p>
        </section>

        {/* ===== FAQ（常時表示カード） ===== */}
        <section className="py-12">
          <h2 className="text-center text-lg md:text-2xl font-black mb-6">よくあるご質問</h2>
          <div className="space-y-3">
            {faq.map((f) => (
              <div key={f.q} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <p className="font-bold text-sm md:text-base mb-2">Q. {f.q}</p>
                <p className="text-sm text-slate-600 leading-relaxed">A. {f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== リードフォーム ===== */}
        <section className="pb-24 md:pb-16 pt-4">
          <p className="text-center text-lg md:text-2xl font-black mb-2">
            まずは無料でご相談ください
          </p>
          <p className="text-center text-sm text-slate-600 mb-6">
            お見積り無料・追加料金なし。30秒で送信できます。
          </p>
          <LeadForm service={serviceLabel} source={slug} />
        </section>
      </div>

      {/* ===== モバイル固定CTAバー ===== */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur border-t border-slate-200 px-3 py-2 flex gap-2">
        <a
          href="tel:0120-792-684"
          className="flex-1 text-center bg-white border border-blue-600 text-blue-700 font-bold py-3 rounded-full text-sm"
        >
          📞 電話する
        </a>
        <a
          href="#lead"
          className="flex-1 text-center bg-amber-400 text-slate-900 font-black py-3 rounded-full text-sm"
        >
          無料で相談
        </a>
      </div>
    </div>
  );
}
