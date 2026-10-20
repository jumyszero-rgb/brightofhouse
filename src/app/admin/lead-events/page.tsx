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
};

type Preset = "today" | "yesterday" | "7d" | "30d" | "custom";
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
    case "yesterday":
      return { from: jstYmd(1), to: jstYmd(1) };
    case "7d":
      return { from: jstYmd(6), to: jstYmd(0) };
    case "30d":
      return { from: jstYmd(29), to: jstYmd(0) };
    default:
      return { from: jstYmd(6), to: jstYmd(0) };
  }
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
  const [type, setType] = useState<"" | LeadEvent["type"]>("");
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [showNames, setShowNames] = useState(false);
  const [nameRows, setNameRows] = useState<{ id: string; name: string }[]>([]);
  const [savingNames, setSavingNames] = useState(false);

  const range = preset === "custom" ? custom : rangeOf(preset);

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
      setUpdatedAt(new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, type]);

  useEffect(() => {
    load();
    const id = setInterval(load, 60 * 1000); // 60秒ごとに自動更新
    return () => clearInterval(id);
  }, [load]);

  // 種類別の件数（広告／広告以外）
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
          60秒ごとに自動で更新されます{updatedAt && `（最終更新 ${updatedAt}）`}。
          電話タップは「かけようとした」記録なので、実際に通話したかどうかまではわかりません。
        </p>

        {/* 期間・種類 */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-gray-600 mr-1">期間</span>
            {(
              [
                ["today", "今日"],
                ["yesterday", "昨日"],
                ["7d", "7日間"],
                ["30d", "30日間"],
                ["custom", "期間指定"],
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
            {preset === "custom" && (
              <span className="flex items-center gap-1 text-sm">
                <input type="date" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} className="border rounded px-2 py-1" />
                〜
                <input type="date" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} className="border rounded px-2 py-1" />
              </span>
            )}
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
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">
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
