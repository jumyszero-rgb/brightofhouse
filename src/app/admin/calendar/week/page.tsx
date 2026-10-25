// @/src/app/admin/calendar/week/page.tsx
// 予約カレンダーの空き枠設定（タブレット用・週表示）。/admin/calendar の「タブレット用（週表示）」から別タブで開く。
//  - サイトのヘッダー・フッターは出さず（SiteShell で出し分け）、カレンダーだけを画面いっぱいに表示（タブレット横向き前提。スマホ縦でも7日が収まる）
//  - 軽さ優先：開いている週の分だけ読み込み、保存は1回の通信、Googleタグも読み込まない（layout.tsx で /admin は除外）
//  - 横に7日（今日から。前の週・次の週で7日ずつ移動）・縦に時間（サイト設定の受付時間＝公開側の予約カレンダーと同じ時間帯）
//  - マスをタップ＝選択／もう一度で解除。日付の見出し＝その日の全時間、時間の見出し＝その週のその時間をまとめて選択
//  - 1つでも選ぶと画面下に固定バー（表に重ねて表示。表の大きさ・位置・スクロールは変えない）
//  - ボタンを押すと、選んだマスをまとめて1回の API（PUT /api/admin/calendar）で保存。表示は先に変え、失敗したときだけ戻して赤で知らせる
//  - 開いている週のデータだけ読み込む（GET /api/admin/calendar?from=&to=）
//  ※ カレンダーからの申し込みはデータベースに保存しない仕様（2026-10）のため、「予約が入っているマス」の表示はしない。
//    申し込みを受けたら、その時間を手で「×」にする。
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { ja } from "date-fns/locale";

type Status = "CONSULT" | "CLOSED";
type Action = "OPEN" | Status;

const CELL = 48; // マスの大きさ(px)。44px以上で固定
const TIME_COL = 52; // 時間の列の幅(px)
// 日付の列の最小幅：スマホ（縦）は48px（7日が画面に収まる）、タブレット以上は88px

const keyOf = (day: Date, hour: number) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0).toISOString();

export default function AdminCalendarWeekPage() {
  // 表示の始まりは「今日」（「今週」＝今日からの7日間。過去の日を開いても変更できないため）
  const [weekStart, setWeekStart] = useState(() => startOfDay(new Date()));
  const [hours, setHours] = useState<{ start: number; end: number }>({ start: 5, end: 22 });
  const [statuses, setStatuses] = useState<Map<string, Status>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [now, setNow] = useState(() => new Date());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadSeq = useRef(0);

  const days = useMemo(() => [...Array(7)].map((_, i) => addDays(weekStart, i)), [weekStart]);
  const hourList = useMemo(() => {
    const list: number[] = [];
    for (let h = hours.start; h < hours.end; h++) list.push(h);
    return list;
  }, [hours]);

  const showToast = useCallback((text: string, error = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, error });
    toastTimer.current = setTimeout(() => setToast(null), error ? 6000 : 2500);
  }, []);

  // 受付時間（公開側の予約カレンダーと同じ設定）
  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (!s) return;
        const start = Number.isFinite(s.calendarStartHour) ? s.calendarStartHour : 5;
        const end = Number.isFinite(s.calendarEndHour) ? s.calendarEndHour : 22;
        if (start >= 0 && end <= 24 && start < end) setHours({ start, end });
      })
      .catch(() => {});
  }, []);

  // 開いている週のデータだけ読み込む
  const loadWeek = useCallback(async (start: Date) => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setLoadError("");
    try {
      const from = start.toISOString();
      const to = addDays(start, 7).toISOString();
      const res = await fetch(`/api/admin/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const rows: { slotTime: string; status: string }[] = await res.json();
      if (seq !== loadSeq.current) return; // 週を切り替えた後に古い結果が届いた
      const m = new Map<string, Status>();
      for (const r of rows) {
        if (r.status === "CONSULT" || r.status === "CLOSED") m.set(new Date(r.slotTime).toISOString(), r.status);
      }
      setStatuses(m);
    } catch {
      if (seq === loadSeq.current) setLoadError("読み込みに失敗しました。通信状態を確認して「再読み込み」を押してください。");
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelected(new Set());
    loadWeek(weekStart);
  }, [weekStart, loadWeek]);

  // 過去のマスの判定用（1分ごとに更新）
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const isPast = useCallback((day: Date, hour: number) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour + 1, 0, 0, 0) <= now, [now]);

  // ── 選択 ──
  const toggleOne = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  // まとめて選択：全部選ばれていれば解除、そうでなければ全部選ぶ
  const toggleMany = (keys: string[]) => {
    if (keys.length === 0) return;
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = keys.every((k) => next.has(k));
      keys.forEach((k) => (allOn ? next.delete(k) : next.add(k)));
      return next;
    });
  };
  const dayKeys = (day: Date) => hourList.filter((h) => !isPast(day, h)).map((h) => keyOf(day, h));
  const hourKeys = (hour: number) => days.filter((d) => !isPast(d, hour)).map((d) => keyOf(d, hour));

  // ── 保存（まとめて1回）：表示を先に変え、失敗したときだけ戻す ──
  const apply = async (action: Action) => {
    const keys = [...selected];
    if (keys.length === 0) return;
    const before = new Map(statuses);
    setStatuses((prev) => {
      const next = new Map(prev);
      keys.forEach((k) => (action === "OPEN" ? next.delete(k) : next.set(k, action)));
      return next;
    });
    setSelected(new Set());
    try {
      const res = await fetch("/api/admin/calendar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: keys, status: action }),
      });
      if (res.status === 401) throw new Error("auth");
      if (!res.ok) throw new Error("save");
      showToast(`保存しました（${keys.length}件）`);
    } catch (e) {
      // 失敗したマスだけ元に戻す（その間に別の操作で変えたマスはそのまま）
      setStatuses((prev) => {
        const next = new Map(prev);
        keys.forEach((k) => {
          const b = before.get(k);
          if (b) next.set(k, b);
          else next.delete(k);
        });
        return next;
      });
      setSelected(new Set(keys));
      showToast(
        (e as Error).message === "auth"
          ? "保存できませんでした：ログインが切れています。管理画面にログインし直してください。"
          : "保存できませんでした。元に戻しました。もう一度お試しください。",
        true,
      );
    }
  };

  const periodLabel = `${format(days[0], "M/d")}〜${format(days[6], "M/d")}`;
  const thisWeek = startOfDay(now);
  const isThisWeek = weekStart.getTime() === thisWeek.getTime();
  const count = selected.size;

  const navBtn =
    "h-11 px-3 md:px-4 rounded-lg border border-slate-300 bg-white font-bold text-sm text-slate-700 active:bg-slate-100";

  return (
    <div
      className="fixed inset-0 flex flex-col bg-slate-50 text-slate-900 select-none"
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
    >
      {/* 上部：週の切り替え */}
      <header className="shrink-0 flex flex-wrap items-center gap-2 px-2 md:px-3 py-2 bg-white border-b border-slate-200">
        <button type="button" onClick={() => setWeekStart((w) => addDays(w, -7))} className={navBtn}>◀ 前の週</button>
        <button type="button" onClick={() => setWeekStart(thisWeek)} disabled={isThisWeek} className={`${navBtn} disabled:opacity-40`}>今週</button>
        <button type="button" onClick={() => setWeekStart((w) => addDays(w, 7))} className={navBtn}>次の週 ▶</button>
        <p className="ml-2 text-lg font-black tabular-nums">{periodLabel}</p>
        {loading && <span className="text-xs text-slate-400">読み込み中…</span>}
        <a href="/admin/calendar" className="md:hidden ml-auto text-xs font-bold text-slate-500 underline">月表示へ</a>
        <div className="ml-auto hidden md:flex items-center gap-3 text-sm font-bold">
          <span className="text-blue-600">○ 空き</span>
          <span className="text-orange-500">▲ 要相談</span>
          <span className="text-red-500">× 受付不可</span>
          <a href="/admin/calendar" className="ml-2 text-xs font-bold text-slate-500 underline">月表示へ</a>
        </div>
      </header>

      {loadError && (
        <div className="shrink-0 flex items-center gap-3 px-3 py-2 bg-red-50 border-b border-red-200 text-sm font-bold text-red-700">
          {loadError}
          <button type="button" onClick={() => loadWeek(weekStart)} className="h-9 px-3 rounded bg-red-600 text-white">再読み込み</button>
        </div>
      )}

      {/* 表：日付の見出し行と時間の列は固定。下のバーの分の余白は常に確保（バーが出ても表は動かない） */}
      <div className="flex-1 overflow-auto overscroll-contain" style={{ paddingBottom: 168 }}>
        <table className="w-full border-separate border-spacing-0 min-w-[388px] md:min-w-[672px]" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th
                className="sticky top-0 left-0 z-30 bg-slate-100 border-b border-r border-slate-300 text-xs font-bold text-slate-500"
                style={{ width: TIME_COL, minWidth: TIME_COL, height: CELL }}
              >
                時間
              </th>
              {days.map((d) => {
                const dow = d.getDay();
                const keys = dayKeys(d);
                const allOn = keys.length > 0 && keys.every((k) => selected.has(k));
                const isToday = format(d, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
                return (
                  <th key={d.toISOString()} className="sticky top-0 z-20 p-0 border-b border-r border-slate-300 bg-slate-100" style={{ height: CELL }}>
                    <button
                      type="button"
                      onClick={() => toggleMany(keys)}
                      disabled={keys.length === 0}
                      className={`w-full h-full px-1 text-sm font-bold leading-tight ${allOn ? "bg-blue-100" : ""} ${
                        dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-600" : "text-slate-800"
                      } disabled:text-slate-400`}
                      style={{ minHeight: CELL }}
                    >
                      <span className={isToday ? "inline-block rounded px-1 bg-amber-200 text-slate-900" : ""}>
                        {format(d, "M/d")}
                        <span className="block md:inline">({format(d, "E", { locale: ja })})</span>
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {hourList.map((h) => {
              const keys = hourKeys(h);
              const allOn = keys.length > 0 && keys.every((k) => selected.has(k));
              return (
                <tr key={h}>
                  <th className="sticky left-0 z-10 p-0 border-b border-r border-slate-300 bg-slate-100" style={{ width: TIME_COL, height: CELL }}>
                    <button
                      type="button"
                      onClick={() => toggleMany(keys)}
                      disabled={keys.length === 0}
                      className={`w-full h-full text-sm font-bold tabular-nums ${allOn ? "bg-blue-100" : ""} text-slate-700 disabled:text-slate-400`}
                      style={{ minHeight: CELL }}
                    >
                      {h}:00
                    </button>
                  </th>
                  {days.map((d) => {
                    const key = keyOf(d, h);
                    const past = isPast(d, h);
                    const st = statuses.get(key);
                    const sel = selected.has(key);
                    const mark = st === "CLOSED" ? "×" : st === "CONSULT" ? "▲" : "○";
                    const color = past
                      ? "bg-slate-100 text-slate-300"
                      : st === "CLOSED"
                        ? "bg-red-50 text-red-500"
                        : st === "CONSULT"
                          ? "bg-orange-50 text-orange-500"
                          : "bg-white text-blue-600";
                    return (
                      <td key={key} className="p-0 border-b border-r border-slate-200" style={{ height: CELL }}>
                        <button
                          type="button"
                          disabled={past}
                          onClick={() => toggleOne(key)}
                          aria-pressed={sel}
                          aria-label={`${format(d, "M/d")} ${h}:00 ${mark}`}
                          className={`block w-full min-w-[48px] md:min-w-[88px] text-xl font-black ${color}`}
                          style={{
                            height: CELL,
                            // 選択中は枠の色だけ変える（大きさ・位置は変えない）
                            boxShadow: sel ? "inset 0 0 0 3px #2563eb" : "none",
                            backgroundColor: sel ? "#dbeafe" : undefined,
                          }}
                        >
                          {mark}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-center text-xs text-slate-400 mt-3">
          受付時間 {hours.start}:00〜{hours.end}:00（サイト設定）。過去の時間は変更できません。
          カレンダーからの申し込みは自動で×になりません（申し込みを受けたら、その時間を×にしてください）。
        </p>
      </div>

      {/* 画面下の固定バー（1つでも選ぶと表示。表に重ねる） */}
      {count > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-slate-300 shadow-[0_-6px_16px_rgba(15,23,42,0.12)] px-3 pt-2"
          style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
        >
          <div className="grid grid-cols-2 md:flex items-center gap-2 max-w-5xl mx-auto">
            <p className="col-span-2 md:col-span-1 shrink-0 text-sm font-bold text-slate-700 tabular-nums mr-1">
              選択中 <span className="text-xl text-blue-700">{count}</span> 件
            </p>
            <button type="button" onClick={() => apply("OPEN")} className="md:flex-1 h-12 md:h-14 rounded-xl bg-blue-600 text-white font-black text-base active:bg-blue-700">○ 空きにする</button>
            <button type="button" onClick={() => apply("CLOSED")} className="md:flex-1 h-12 md:h-14 rounded-xl bg-red-600 text-white font-black text-base active:bg-red-700">× 受付不可にする</button>
            <button type="button" onClick={() => apply("CONSULT")} className="md:flex-1 h-12 md:h-14 rounded-xl bg-orange-500 text-white font-black text-base active:bg-orange-600">▲ 要相談にする</button>
            <button type="button" onClick={() => setSelected(new Set())} className="shrink-0 h-12 md:h-14 px-4 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-bold text-sm active:bg-slate-100">選択を解除</button>
          </div>
        </div>
      )}

      {/* 保存のお知らせ（画面の端に小さく。数秒で消える） */}
      {toast && (
        <div
          role="status"
          className={`fixed right-3 z-50 max-w-sm rounded-lg px-4 py-2 text-sm font-bold shadow-lg ${
            toast.error ? "bg-red-600 text-white" : "bg-slate-800/90 text-white"
          }`}
          style={{ top: 64 }}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
