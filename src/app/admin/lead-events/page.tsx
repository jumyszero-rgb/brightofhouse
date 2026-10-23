// @/src/app/admin/lead-events/page.tsx
// 問い合わせ行動（電話タップ・LINEタップ・フォーム送信・予約）の一覧（修正依頼書 0-E）。
// GA4の反映待ちなしで、押された直後に「どのページ・どの広告／キーワードから来た人か」を確認できる。
// 60秒ごとに自動更新（開いたままにしておけば、電話を受けた直後に見られる）。
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { campaignLabel, classifySource, matchTypeLabel } from "@/lib/leadSource";

type LeadEvent = {
  id: string;
  createdAt: string;
  type: "phone" | "line" | "form" | "booking";
  phoneNumber: string | null;
  pagePath: string;
  landingPath: string | null;
  referrer: string | null;
  isAd: boolean;
  gclid: string | null;
  campaignId: string | null;
  adGroupId: string | null;
  assetGroupId: string | null;
  keyword: string | null;
  matchType: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  device: string | null;
  bookingId: string | null;
  // 過去の広告訪問（ブラウザに残した記録・90日以内）
  firstAdAt?: string | null;
  firstAdKeyword?: string | null;
  firstAdMatchType?: string | null;
  firstAdLanding?: string | null;
  firstAdCampaignId?: string | null;
  lastAdAt?: string | null;
};

/** 広告との関係：今回広告から／前に広告で来て今回は別の経路から／広告を見た記録なし */
type AdTouch = "ad" | "returning" | "none";
const adTouchOf = (e: LeadEvent): AdTouch => (e.isAd ? "ad" : e.firstAdAt || e.lastAdAt ? "returning" : "none");
const AD_TOUCH_LABEL: Record<AdTouch, string> = {
  ad: "広告から来て問い合わせ",
  returning: "前に広告で来て、今回は別の経路から問い合わせ",
  none: "広告を見た記録なし",
};
const AD_TOUCH_COLOR: Record<AdTouch, string> = {
  ad: "border-red-300 bg-red-50 text-red-700",
  returning: "border-amber-300 bg-amber-50 text-amber-800",
  none: "border-slate-200 bg-white text-slate-700",
};
/** 今回の流入元（広告以外）を4つにまとめる：Google検索／Googleマップ／直接／その他 */
const SOURCE_BUCKETS = ["Google検索", "Googleマップ", "直接", "その他"] as const;
const sourceBucket = (e: LeadEvent): (typeof SOURCE_BUCKETS)[number] => {
  const s = classifySource({ isAd: false, referrer: e.referrer, utmSource: e.utmSource, utmMedium: e.utmMedium });
  return s === "Google検索" || s === "Googleマップ" || s === "直接" ? s : "その他";
};
/** 「10/19」の形（日本時間） */
const jstMd = (iso?: string | null) =>
  iso ? new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric" }).format(new Date(iso)) : "";

type Preset = "today" | "7d" | "month" | "custom";
const TYPE_LABEL: Record<LeadEvent["type"], string> = { phone: "電話", line: "LINE", form: "フォーム", booking: "予約" };
const TYPE_COLOR: Record<LeadEvent["type"], string> = {
  phone: "bg-blue-100 text-blue-700",
  line: "bg-green-100 text-green-700",
  form: "bg-amber-100 text-amber-800",
  booking: "bg-purple-100 text-purple-700",
};
const TYPES: LeadEvent["type"][] = ["phone", "line", "form", "booking"];

/** 日本時間の日付 "YYYY-MM-DD"（daysAgo日前） */
function jstYmd(daysAgo = 0): string {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(d);
}
function rangeOf(p: Preset): { from: string; to: string } {
  switch (p) {
    case "today":
      return { from: jstYmd(0), to: jstYmd(0) };
    case "7d":
      return { from: jstYmd(6), to: jstYmd(0) };
    case "month":
      return monthRange(jstYmd(0).slice(0, 7));
    default:
      return { from: jstYmd(6), to: jstYmd(0) };
  }
}
/** "YYYY-MM" → その月の1日〜月末（今月なら今日まで） */
function monthRange(ym: string): { from: string; to: string } {
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!m) return rangeOf("7d");
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate(); // その月の日数
  const from = `${ym}-01`;
  const end = `${ym}-${String(lastDay).padStart(2, "0")}`;
  const today = jstYmd(0);
  return { from, to: end > today ? today : end };
}
/** 期間指定：開始と終了が逆なら入れ替える */
function normalizeRange(r: { from: string; to: string }): { from: string; to: string } {
  if (!r.from || !r.to) return rangeOf("7d");
  return r.from <= r.to ? r : { from: r.to, to: r.from };
}
function jstTime(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

export default function LeadEventsPage() {
  const [preset, setPreset] = useState<Preset>("today");
  const [custom, setCustom] = useState(() => rangeOf("7d"));
  const [month, setMonth] = useState(() => jstYmd(0).slice(0, 7)); // "YYYY-MM"
  const [type, setType] = useState<"" | LeadEvent["type"]>("");
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [pages, setPages] = useState<{ path: string; views: number; adViews: number; mobileViews?: number; desktopViews?: number }[]>([]);
  const [showAllPages, setShowAllPages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [showNames, setShowNames] = useState(false);
  const [nameRows, setNameRows] = useState<{ id: string; name: string }[]>([]);
  const [savingNames, setSavingNames] = useState(false);

  const range = preset === "custom" ? normalizeRange(custom) : preset === "month" ? monthRange(month) : rangeOf(preset);
  const todayYmd = jstYmd(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams({ from: range.from, to: range.to });
      if (type) q.set("type", type);
      const res = await fetch(`/api/admin/lead-events?${q.toString()}`, { cache: "no-store" });
      if (res.status === 401) throw new Error("ログインが切れています。もう一度ログインしてください。");
      if (!res.ok) throw new Error("読み込みに失敗しました");
      const data = await res.json();
      setEvents(Array.isArray(data.events) ? data.events : []);
      setNames(data.campaignNames || {});
      setPages(Array.isArray(data.pages) ? data.pages : []);
      setUpdatedAt(new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, type]);

  // 60秒ごとに自動更新。ただし通信量（Supabaseの転送量）を抑えるため、
  //  - 期間に今日が含まれるときだけ（過去の期間は数字が変わらない）
  //  - このタブが表示されているときだけ（裏に置いたままなら止める・戻ったら1回更新）
  const includesToday = range.to >= todayYmd;
  useEffect(() => {
    load();
    if (!includesToday) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load, includesToday]);

  // 種類別の件数（広告／広告以外）
  // ページごとの問い合わせ件数（その期間に、そのページで押された・送信された件数）
  const leadsByPath = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of events) {
      let p = (e.pagePath || "").split("?")[0];
      try { p = decodeURI(p); } catch { /* そのまま */ }
      if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
      m[p] = (m[p] || 0) + 1;
    }
    return m;
  }, [events]);
  const totalViews = useMemo(() => pages.reduce((a, p) => a + p.views, 0), [pages]);
  const totalMobile = useMemo(() => pages.reduce((a, p) => a + (p.mobileViews || 0), 0), [pages]);
  const totalDesktop = useMemo(() => pages.reduce((a, p) => a + (p.desktopViews || 0), 0), [pages]);
  const totalUnknown = Math.max(0, totalViews - totalMobile - totalDesktop);
  // ページごとの問い合わせ件数をスマホ／PC別に（問い合わせ行動の記録の端末）
  const leadsByPathDevice = useMemo(() => {
    const m: Record<string, { mobile: number; desktop: number }> = {};
    for (const e of events) {
      let p = (e.pagePath || "").split("?")[0];
      try { p = decodeURI(p); } catch { /* そのまま */ }
      if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
      const v = (m[p] ||= { mobile: 0, desktop: 0 });
      if (e.device === "mobile") v.mobile++;
      else if (e.device === "desktop") v.desktop++;
    }
    return m;
  }, [events]);
  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "");

  // 広告との関係（3区分）と、広告以外の内訳（今回の流入元）
  const adTouchSummary = useMemo(() => {
    const keys: AdTouch[] = ["ad", "returning", "none"];
    return keys.map((k) => {
      const list = events.filter((e) => adTouchOf(e) === k);
      const bySource = SOURCE_BUCKETS.map((b) => ({ label: b, count: list.filter((e) => sourceBucket(e) === b).length }));
      return { key: k, count: list.length, bySource };
    });
  }, [events]);

  const summary = useMemo(() => {
    const out = TYPES.map((t) => {
      const list = events.filter((e) => e.type === t);
      return { type: t, total: list.length, ad: list.filter((e) => e.isAd).length };
    });
    return out;
  }, [events]);

  const openNames = () => {
    const rows = Object.entries(names).map(([id, name]) => ({ id, name }));
    setNameRows(rows.length ? [...rows, { id: "", name: "" }] : [{ id: "", name: "" }]);
    setShowNames(true);
  };
  const saveNames = async () => {
    setSavingNames(true);
    try {
      const campaignNames: Record<string, string> = {};
      for (const r of nameRows) if (r.id.trim() && r.name.trim()) campaignNames[r.id.trim()] = r.name.trim();
      const res = await fetch("/api/admin/lead-events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignNames }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNames(data.campaignNames || {});
      setShowNames(false);
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSavingNames(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 text-black">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">問い合わせ行動</h1>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">← ダッシュボードへ</Link>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          電話ボタン・LINEボタンが押された瞬間と、フォーム送信・予約の完了を記録しています（GA4とは別の自前の記録）。
          期間に今日が含まれるときは、この画面を開いている間60秒ごとに自動で更新されます{updatedAt && `（最終更新 ${updatedAt}）`}。
          電話タップは「かけようとした」記録なので、実際に通話したかどうかまではわかりません。
          ページ表示はページ×日ごとの回数だけを記録しています（個人は特定しません）。
        </p>

        {/* 期間・種類 */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-gray-600 mr-1">期間</span>
            {(
              [
                ["today", "今日"],
                ["7d", "7日"],
                ["month", "月"],
                ["custom", "カスタム"],
              ] as [Preset, string][]
            ).map(([p, label]) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`px-3 py-1.5 rounded-full text-sm font-bold border ${preset === p ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700"}`}
              >
                {label}
              </button>
            ))}
            {preset === "month" && (
              <span className="flex items-center gap-1 text-sm">
                <input
                  type="month"
                  value={month}
                  max={todayYmd.slice(0, 7)}
                  onChange={(e) => e.target.value && setMonth(e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </span>
            )}
            {preset === "custom" && (
              <span className="flex items-center gap-1 text-sm">
                <input type="date" value={custom.from} max={todayYmd} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} className="border rounded px-2 py-1" />
                〜
                <input type="date" value={custom.to} max={todayYmd} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} className="border rounded px-2 py-1" />
              </span>
            )}
            <span className="text-xs text-gray-500">
              {range.from === range.to ? range.from : `${range.from} 〜 ${range.to}`}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-gray-600 mr-1">種類</span>
            {([["", "すべて"], ...TYPES.map((t) => [t, TYPE_LABEL[t]])] as [string, string][]).map(([t, label]) => (
              <button
                key={t || "all"}
                onClick={() => setType(t as "" | LeadEvent["type"])}
                className={`px-3 py-1.5 rounded-full text-sm font-bold border ${type === t ? "bg-slate-800 text-white border-slate-800" : "bg-white text-gray-700"}`}
              >
                {label}
              </button>
            ))}
            <button onClick={load} disabled={loading} className="ml-auto text-sm font-bold px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50">
              {loading ? "更新中…" : "今すぐ更新"}
            </button>
          </div>
        </div>

        {error && <p className="text-red-600 font-bold text-sm">{error}</p>}

        {/* 集計カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summary.map((s) => (
            <div key={s.type} className="bg-white rounded-xl shadow-sm p-4">
              <p className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${TYPE_COLOR[s.type]}`}>{TYPE_LABEL[s.type]}</p>
              <p className="text-3xl font-black mt-2">{s.total}<span className="text-sm font-bold text-gray-500 ml-1">件</span></p>
              <p className="text-xs text-gray-500 mt-1">広告 {s.ad}／広告以外 {s.total - s.ad}</p>
            </div>
          ))}
        </div>

        {/* 広告との関係（今回の訪問＋ブラウザに残した過去の広告訪問から判定） */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-baseline justify-between gap-2 flex-wrap mb-3">
            <h2 className="font-bold text-gray-800">広告との関係</h2>
            <p className="text-[11px] text-gray-500">
              ※過去の広告訪問は、お客様のブラウザに90日間残した記録で判定しています。別のスマホ・PC・ブラウザで戻ってきた場合や、閲覧履歴を消した場合は「広告を見た記録なし」になります。
              この機能を入れる前の記録は「前に広告で来た」かどうか分かりません。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {adTouchSummary.map((a) => (
              <div key={a.key} className={`rounded-xl border p-4 ${AD_TOUCH_COLOR[a.key]}`}>
                <p className="text-xs font-bold leading-snug">{AD_TOUCH_LABEL[a.key]}</p>
                <p className="text-3xl font-black mt-2">
                  {a.count}
                  <span className="text-sm font-bold ml-1">件</span>
                  {events.length > 0 && <span className="text-xs font-bold ml-2 opacity-70">{Math.round((a.count / events.length) * 100)}%</span>}
                </p>
                {a.key !== "ad" && a.count > 0 && (
                  <p className="text-[11px] mt-1 opacity-90">
                    今回の流入元：{a.bySource.filter((b) => b.count > 0).map((b) => `${b.label} ${b.count}`).join("／")}
                  </p>
                )}
              </div>
            ))}
          </div>
          {(() => {
            const nonAd = events.filter((e) => !e.isAd);
            if (!nonAd.length) return null;
            return (
              <div className="mt-3 overflow-x-auto">
                <p className="text-xs font-bold text-gray-600 mb-1">広告以外（{nonAd.length}件）の内訳：今回の流入元 × 過去の広告訪問</p>
                <table className="min-w-[420px] text-xs border">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-2 text-left">今回の流入元</th>
                      <th className="p-2 text-right">前に広告で来た</th>
                      <th className="p-2 text-right">広告の記録なし</th>
                      <th className="p-2 text-right">合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SOURCE_BUCKETS.map((b) => {
                      const rows = nonAd.filter((e) => sourceBucket(e) === b);
                      const ret = rows.filter((e) => adTouchOf(e) === "returning").length;
                      return (
                        <tr key={b} className="border-t">
                          <td className="p-2">{b}</td>
                          <td className="p-2 text-right font-bold text-amber-700">{ret}</td>
                          <td className="p-2 text-right">{rows.length - ret}</td>
                          <td className="p-2 text-right">{rows.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>

        {/* 人気のページ（ページ表示の集計） */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-baseline justify-between gap-2 flex-wrap mb-3">
            <h2 className="font-bold text-gray-800">人気のページ</h2>
            <p className="text-xs text-gray-500">
              期間内のページ表示 合計 <span className="font-bold text-gray-800">{totalViews.toLocaleString()}</span> 回
              （📱スマホ <span className="font-bold text-gray-800">{totalMobile.toLocaleString()}</span> {pct(totalMobile, totalViews)}
              ／💻PC <span className="font-bold text-gray-800">{totalDesktop.toLocaleString()}</span> {pct(totalDesktop, totalViews)}
              {totalUnknown > 0 && <>／端末の記録前 {totalUnknown.toLocaleString()}</>}）
              ・同じ人が何度見ても1回ずつ数えます
            </p>
          </div>
          {pages.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">この期間のページ表示の記録はありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs">
                  <tr>
                    <th className="p-2 text-right w-10">#</th>
                    <th className="p-2 text-left">ページ</th>
                    <th className="p-2 text-right">表示回数</th>
                    <th className="p-2 text-right">うち広告</th>
                    <th className="p-2 text-right whitespace-nowrap">📱スマホ</th>
                    <th className="p-2 text-right whitespace-nowrap">💻PC</th>
                    <th className="p-2 text-right">問い合わせ</th>
                    <th className="p-2 text-right">問い合わせ率</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllPages ? pages : pages.slice(0, 20)).map((p, i) => {
                    const leads = leadsByPath[p.path] || 0;
                    return (
                      <tr key={p.path} className="border-t">
                        <td className="p-2 text-right text-gray-400">{i + 1}</td>
                        <td className="p-2 break-all">
                          <a href={p.path} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-blue-700 hover:underline">{p.path}</a>
                        </td>
                        <td className="p-2 text-right font-bold">{p.views.toLocaleString()}</td>
                        <td className="p-2 text-right text-red-600">{p.adViews.toLocaleString()}</td>
                        <td className="p-2 text-right whitespace-nowrap">
                          {(p.mobileViews || 0).toLocaleString()}
                          <span className="text-[10px] text-gray-400 ml-1">{pct(p.mobileViews || 0, p.views)}</span>
                        </td>
                        <td className="p-2 text-right whitespace-nowrap">
                          {(p.desktopViews || 0).toLocaleString()}
                          <span className="text-[10px] text-gray-400 ml-1">{pct(p.desktopViews || 0, p.views)}</span>
                        </td>
                        <td className="p-2 text-right whitespace-nowrap">
                          {leads || "-"}
                          {leads > 0 && (
                            <span className="block text-[10px] text-gray-400">
                              📱{leadsByPathDevice[p.path]?.mobile || 0}／💻{leadsByPathDevice[p.path]?.desktop || 0}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-right">{leads && p.views ? `${((leads / p.views) * 100).toFixed(1)}%` : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {pages.length > 20 && (
                <button onClick={() => setShowAllPages((v) => !v)} className="mt-2 text-sm font-bold text-blue-600 hover:underline">
                  {showAllPages ? "上位20件だけ表示" : `すべて表示（${pages.length}件）`}
                </button>
              )}
              <p className="text-[11px] text-gray-400 mt-2">
                ※ 問い合わせは、そのページで電話・LINEのタップ、フォーム送信、予約があった件数です（上の「種類」の絞り込みに連動）。
                スマホ／PCは画面の幅で判定しています（768px未満＝スマホ。タブレットは横幅によってPCに入ります）。この機能を入れる前の表示回数は、スマホ／PCのどちらにも入っていません。
              </p>
            </div>
          )}
        </div>

        {/* 一覧 */}
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="min-w-[1200px] w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs">
              <tr>
                <th className="p-3 text-left whitespace-nowrap">時刻（日本時間）</th>
                <th className="p-3 text-left">種類</th>
                <th className="p-3 text-left">見ていたページ</th>
                <th className="p-3 text-left">最初のページ</th>
                <th className="p-3 text-left">流入</th>
                <th className="p-3 text-left">キャンペーン</th>
                <th className="p-3 text-left">広告グループ</th>
                <th className="p-3 text-left">キーワード</th>
                <th className="p-3 text-left">マッチ</th>
                <th className="p-3 text-left">端末</th>
                <th className="p-3 text-left whitespace-nowrap">過去の広告訪問</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-gray-500">
                    {loading ? "読み込み中…" : "この期間の記録はありません"}
                  </td>
                </tr>
              )}
              {events.map((e) => (
                <tr key={e.id} className="border-t align-top">
                  <td className="p-3 whitespace-nowrap font-mono text-xs">{jstTime(e.createdAt)}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${TYPE_COLOR[e.type]}`}>{TYPE_LABEL[e.type]}</span>
                    {e.type === "phone" && e.phoneNumber && <span className="block text-[11px] text-gray-500 mt-1 font-mono">{e.phoneNumber}</span>}
                    {e.type === "booking" && (
                      <Link href="/admin/bookings" className="block text-[11px] text-blue-600 hover:underline mt-1">予約一覧へ</Link>
                    )}
                  </td>
                  <td className="p-3 break-all max-w-[220px] font-mono text-xs">{e.pagePath}</td>
                  <td className="p-3 break-all max-w-[220px] font-mono text-xs">{e.landingPath || "-"}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={e.isAd ? "font-bold text-red-600" : ""}>
                      {classifySource({ isAd: e.isAd, referrer: e.referrer, utmSource: e.utmSource, utmMedium: e.utmMedium })}
                    </span>
                    {adTouchOf(e) === "returning" && (
                      <span className="block mt-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded w-fit">前に広告で来た人</span>
                    )}
                    {e.utmCampaign && <span className="block text-[11px] text-gray-500">{e.utmCampaign}</span>}
                  </td>
                  <td className="p-3">{campaignLabel(e.campaignId, names) || "-"}</td>
                  <td className="p-3">
                    {e.adGroupId
                      ? campaignLabel(e.adGroupId, names)
                      : e.assetGroupId
                      ? <>{campaignLabel(e.assetGroupId, names)}<span className="block text-[11px] text-gray-500">アセットグループ</span></>
                      : "-"}
                  </td>
                  <td className="p-3 break-all max-w-[200px]">{e.keyword || e.utmTerm || "-"}</td>
                  <td className="p-3 whitespace-nowrap">{matchTypeLabel(e.matchType) || "-"}</td>
                  <td className="p-3 whitespace-nowrap">{e.device === "mobile" ? "スマホ" : e.device === "desktop" ? "PC" : "-"}</td>
                  <td className="p-3 min-w-[200px]">
                    {e.firstAdAt ? (
                      <div className={adTouchOf(e) === "returning" ? "text-amber-800" : "text-gray-600"}>
                        <p className="font-bold">
                          {jstMd(e.firstAdAt)} 広告で初回訪問
                          {e.firstAdKeyword && <>（キーワード：{e.firstAdKeyword}{e.firstAdMatchType ? `・${matchTypeLabel(e.firstAdMatchType)}` : ""}）</>}
                        </p>
                        {e.firstAdCampaignId && <p className="text-[11px]">{campaignLabel(e.firstAdCampaignId, names)}</p>}
                        {e.lastAdAt && jstMd(e.lastAdAt) !== jstMd(e.firstAdAt) && <p className="text-[11px]">最後に広告から：{jstMd(e.lastAdAt)}</p>}
                        {e.firstAdLanding && <p className="text-[11px] font-mono break-all text-gray-400">{e.firstAdLanding.split("?")[0]}</p>}
                      </div>
                    ) : e.lastAdAt ? (
                      <span className="text-amber-800 text-xs">最後に広告から：{jstMd(e.lastAdAt)}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {events.length >= 2000 && <p className="text-xs text-gray-500">※ 表示は新しい順に最大2,000件です。期間を短くしてください。</p>}

        {/* キャンペーン名の対応表 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          {!showNames ? (
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm text-gray-600">
                キャンペーン・広告グループ名の表示：
                {Object.keys(names).length === 0
                  ? "未設定（IDのまま表示されます）"
                  : Object.entries(names).map(([id, n]) => `${n}（${id}）`).join("、")}
              </p>
              <button onClick={openNames} className="text-sm font-bold px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50">
                名前を編集
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-bold">ID → 表示名（キャンペーン・広告グループ・アセットグループ共通）</p>
              <p className="text-xs text-gray-500">
                IDはGoogle広告の画面のURL（campaignId=／adGroupId=／assetGroupId= の後ろの数字）で確認できます。
                一覧に出てきたIDをそのまま登録してもOKです。
              </p>
              {nameRows.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={r.id}
                    onChange={(e) => setNameRows((rows) => rows.map((x, j) => (j === i ? { ...x, id: e.target.value.replace(/[^\d]/g, "") } : x)))}
                    placeholder="ID（数字）"
                    className="w-48 border rounded px-2 py-1 font-mono text-sm"
                  />
                  <input
                    value={r.name}
                    onChange={(e) => setNameRows((rows) => rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    placeholder="表示名（例：水回り／浴室）"
                    className="flex-1 border rounded px-2 py-1 text-sm"
                  />
                  <button onClick={() => setNameRows((rows) => rows.filter((_, j) => j !== i))} className="text-xs text-red-600 font-bold px-2">
                    削除
                  </button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setNameRows((rows) => [...rows, { id: "", name: "" }])} className="text-sm font-bold px-3 py-1.5 rounded border border-gray-300">
                  ＋ 行を追加
                </button>
                <button onClick={saveNames} disabled={savingNames} className="text-sm font-bold px-4 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50">
                  {savingNames ? "保存中…" : "保存"}
                </button>
                <button onClick={() => setShowNames(false)} className="text-sm px-3 py-1.5 text-gray-600">
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
