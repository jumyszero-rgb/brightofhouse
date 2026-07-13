// @/src/app/admin/calendar/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, addDays, startOfDay, eachHourOfInterval, setHours } from "date-fns";
import { ja } from "date-fns/locale";

export default function AdminCalendarPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfDay(new Date()));
  const [overrides, setOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 一括選択用のステート
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 日時入力による範囲一括変更用（ドラッグが使いづらい端末向けの代替手段）
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [rangeStartDate, setRangeStartDate] = useState(todayStr);
  const [rangeStartHour, setRangeStartHour] = useState(9);
  const [rangeEndDate, setRangeEndDate] = useState(todayStr);
  const [rangeEndHour, setRangeEndHour] = useState(18);

  // 選択範囲に含まれるか判定
  const isSelected = (date: Date) => {
    if (!selectionStart || !selectionEnd) return false;
    const start = selectionStart < selectionEnd ? selectionStart : selectionEnd;
    const end = selectionStart < selectionEnd ? selectionEnd : selectionStart;
    return date >= start && date <= end;
  };

  const fetchOverrides = async () => {
    try {
      const res = await fetch("/api/admin/calendar");
      if (res.ok) {
        const data = await res.json();
        setOverrides(data);
      }
    } catch (e) {
      console.error("Fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverrides();
  }, []);

  // 単一更新
  const toggleStatus = async (slotTime: Date, currentStatus: string | null) => {
    if (updating) return;
    setUpdating(true);

    const normalizedTime = new Date(slotTime.getFullYear(), slotTime.getMonth(), slotTime.getDate(), slotTime.getHours(), 0, 0, 0).toISOString();
    
    let nextStatus: string | null = null;
    if (!currentStatus) nextStatus = "CONSULT";
    else if (currentStatus === "CONSULT") nextStatus = "CLOSED";
    else nextStatus = null;

    try {
      const res = await fetch("/api/admin/calendar", {
        method: nextStatus === null ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotTime: normalizedTime, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Save failed");
      await fetchOverrides(); 
    } catch (e: any) {
      alert("失敗しました");
    } finally {
      setUpdating(false);
    }
  };

  // 一括更新
  const handleBulkChange = async (targetStatus: string | null) => {
    if (!selectionStart || !selectionEnd || updating) return;
    setUpdating(true);

    const start = selectionStart < selectionEnd ? selectionStart : selectionEnd;
    const end = selectionStart < selectionEnd ? selectionEnd : selectionStart;

    const targets: string[] = [];
    days.forEach(day => {
      timeSlots.forEach(slot => {
        const current = new Date(day.getFullYear(), day.getMonth(), day.getDate(), slot.getHours(), 0, 0, 0);
        if (current >= start && current <= end) {
          targets.push(current.toISOString());
        }
      });
    });

    try {
      await Promise.all(targets.map(slotTime => 
        fetch("/api/admin/calendar", {
          method: targetStatus === null ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slotTime, status: targetStatus }),
        })
      ));
      await fetchOverrides();
      setSelectionStart(null);
      setSelectionEnd(null);
    } catch (e) {
      alert("一括更新に失敗しました");
    } finally {
      setUpdating(false);
    }
  };

  // 日時入力による範囲一括更新（ドラッグ操作が難しい端末向け）
  const handleRangeChange = async (targetStatus: string | null) => {
    if (!rangeStartDate || !rangeEndDate || updating) return;

    const start = new Date(rangeStartDate + "T00:00:00");
    start.setHours(rangeStartHour, 0, 0, 0);
    const end = new Date(rangeEndDate + "T00:00:00");
    end.setHours(rangeEndHour, 0, 0, 0);

    if (start > end) {
      alert("開始日時が終了日時より後になっています");
      return;
    }

    const targets: string[] = [];
    for (const t = new Date(start); t <= end; t.setHours(t.getHours() + 1)) {
      targets.push(new Date(t).toISOString());
    }

    if (targets.length > 1000) {
      alert("一度に指定できる範囲が大きすぎます。期間を分けて実行してください。");
      return;
    }

    setUpdating(true);
    try {
      await Promise.all(targets.map(slotTime =>
        fetch("/api/admin/calendar", {
          method: targetStatus === null ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slotTime, status: targetStatus }),
        })
      ));
      await fetchOverrides();
    } catch (e) {
      alert("一括更新に失敗しました");
    } finally {
      setUpdating(false);
    }
  };

  const days = [...Array(14)].map((_, i) => addDays(currentWeekStart, i));
  const timeSlots = eachHourOfInterval({
    start: setHours(startOfDay(new Date()), 0),
    end: setHours(startOfDay(new Date()), 23),
  });

  // スマホ・タブレットのドラッグ選択用。touchmoveは指を乗せた要素ではなく最初にタッチした要素に
  // 送られ続けるため（mouseenterのように別要素へは飛ばない）、座標から要素を都度特定する。
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    if (!touch) return;
    const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const target = el?.closest("[data-slot-iso]") as HTMLElement | null;
    const iso = target?.getAttribute("data-slot-iso");
    if (iso) setSelectionEnd(new Date(iso));
  };

  return (
    <div
      className={`min-h-screen bg-gray-50 p-8 text-black transition-opacity ${updating ? 'opacity-70 pointer-events-none' : ''}`}
      onMouseUp={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsDragging(false)}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">📅 カレンダー空き枠設定</h1>
            <p className="text-gray-500 text-sm mt-1">枠をドラッグで範囲選択して一括変更、またはクリックで切り替え。</p>
          </div>
          <div className="flex gap-4">
            {selectionStart && selectionEnd && (
              <div className="flex gap-2 bg-yellow-100 p-1 rounded-lg border border-yellow-200">
                <button onClick={() => handleBulkChange(null)} className="bg-white px-3 py-1 rounded text-xs font-bold shadow-sm hover:bg-gray-50">全て 〇</button>
                <button onClick={() => handleBulkChange("CONSULT")} className="bg-white px-3 py-1 rounded text-xs font-bold shadow-sm hover:bg-gray-50 text-orange-500">全て ▲</button>
                <button onClick={() => handleBulkChange("CLOSED")} className="bg-white px-3 py-1 rounded text-xs font-bold shadow-sm hover:bg-gray-50 text-red-500">全て ×</button>
                <button onClick={() => { setSelectionStart(null); setSelectionEnd(null); }} className="bg-gray-200 px-3 py-1 rounded text-xs font-bold hover:bg-gray-300">解除</button>
              </div>
            )}
            <button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))} className="bg-white border px-4 py-2 rounded shadow-sm font-bold text-sm hover:bg-gray-50 transition-colors">◀ 前の週</button>
            <button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))} className="bg-white border px-4 py-2 rounded shadow-sm font-bold text-sm hover:bg-gray-50 transition-colors">次の週 ▶</button>
            <Link href="/admin" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm font-bold flex items-center">メニューへ戻る</Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
          <p className="text-sm font-bold text-gray-700 mb-3">日時を指定して一括変更（ドラッグ操作が難しい場合はこちら）</p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">開始日</label>
              <input type="date" value={rangeStartDate} onChange={(e) => setRangeStartDate(e.target.value)} className="p-2 border rounded text-black text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">開始時刻</label>
              <select value={rangeStartHour} onChange={(e) => setRangeStartHour(parseInt(e.target.value))} className="p-2 border rounded text-black text-sm">
                {[...Array(24)].map((_, h) => <option key={h} value={h}>{h}:00</option>)}
              </select>
            </div>
            <span className="text-gray-400 pb-2">〜</span>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">終了日</label>
              <input type="date" value={rangeEndDate} onChange={(e) => setRangeEndDate(e.target.value)} className="p-2 border rounded text-black text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">終了時刻</label>
              <select value={rangeEndHour} onChange={(e) => setRangeEndHour(parseInt(e.target.value))} className="p-2 border rounded text-black text-sm">
                {[...Array(24)].map((_, h) => <option key={h} value={h}>{h}:00</option>)}
              </select>
            </div>
            <div className="flex gap-2 ml-auto">
              <button onClick={() => handleRangeChange(null)} className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-2 rounded text-xs font-bold hover:bg-emerald-100">〇にする</button>
              <button onClick={() => handleRangeChange("CONSULT")} className="bg-orange-50 text-orange-600 border border-orange-200 px-3 py-2 rounded text-xs font-bold hover:bg-orange-100">▲にする</button>
              <button onClick={() => handleRangeChange("CLOSED")} className="bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded text-xs font-bold hover:bg-red-100">×にする</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse select-none">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200">
                  <th className="p-3 text-xs font-bold w-20 sticky left-0 bg-slate-50 z-10 text-black">時間</th>
                  {days.map(day => (
                    <th key={day.toISOString()} className="p-3 border-l text-xs font-bold text-black">
                      {format(day, "M/d")}<br/><span className={format(day, "E", {locale:ja}) === "日" ? "text-red-500" : format(day, "E", {locale:ja}) === "土" ? "text-blue-500" : ""}>({format(day, "E", {locale:ja})})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(slot => (
                  <tr key={slot.toISOString()} className="hover:bg-slate-50/30">
                    <td className="p-2 border-b text-xs font-bold bg-slate-50 sticky left-0 z-10 text-black">{format(slot, "HH:00")}</td>
                    {days.map(day => {
                      const current = new Date(day.getFullYear(), day.getMonth(), day.getDate(), slot.getHours(), 0, 0, 0);
                      const currentISO = current.toISOString();
                      const override = overrides.find(o => new Date(o.slotTime).toISOString() === currentISO);
                      
                      const isPast = current < new Date();
                      const status = isPast ? "CLOSED" : (override?.status || null);
                      const selected = isSelected(current);

                      return (
                        <td key={currentISO} className="p-1 border-b border-l relative">
                          <button
                            type="button"
                            disabled={isPast}
                            data-slot-iso={currentISO}
                            onMouseDown={() => {
                              if (isPast) return;
                              setSelectionStart(current);
                              setSelectionEnd(current);
                              setIsDragging(true);
                            }}
                            onMouseEnter={() => {
                              if (isDragging && !isPast) setSelectionEnd(current);
                            }}
                            onTouchStart={() => {
                              if (isPast) return;
                              setSelectionStart(current);
                              setSelectionEnd(current);
                              setIsDragging(true);
                            }}
                            onClick={() => {
                              if (!isDragging && !isPast) toggleStatus(current, status);
                            }}
                            className={`w-full h-12 flex items-center justify-center rounded font-bold text-2xl transition-all ${
                              isPast ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                              selected ? 'ring-2 ring-inset ring-blue-400 bg-blue-50 z-20' : ''
                            } ${
                              !isPast && status === "CLOSED" ? "bg-red-50 text-red-500" : 
                              !isPast && status === "CONSULT" ? "bg-orange-50 text-orange-500" : 
                              !isPast ? "text-blue-500 hover:bg-blue-50" : ""
                            }`}
                          >
                            {status === "CLOSED" || isPast ? "×" : status === "CONSULT" ? "▲" : "○"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-8 bg-blue-50 p-4 rounded-lg flex gap-6 justify-center text-sm font-bold text-black">
          <span className="flex items-center gap-2 text-blue-600">○：通常受付</span>
          <span className="flex items-center gap-2 text-orange-500">▲：要相談</span>
          <span className="flex items-center gap-2 text-red-500">×：休み・受付不可</span>
        </div>
      </div>
    </div>
  );
}