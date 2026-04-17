// @/src/components/BookingCalendar.tsx
"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfDay, eachHourOfInterval, setHours, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

type Props = {
  category: string;
  onSelectSlot: (date: Date) => void;
};

export default function BookingCalendar({ category, onSelectSlot }: Props) {
  const [bookedSlots, setBookedSlots] = useState<Date[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      const res = await fetch(`/api/booking?category=${encodeURIComponent(category)}`);
      if (res.ok) {
        const data = await res.json();
        setBookedSlots(data.map((b: any) => parseISO(b.startTime)));
      }
    };
    fetchBookings();
  }, [category]);

  const days = [...Array(7)].map((_, i) => addDays(startOfDay(new Date()), i));
  const timeSlots = eachHourOfInterval({
    start: setHours(startOfDay(new Date()), 9),
    end: setHours(startOfDay(new Date()), 18),
  });

  return (
    // ▼ 修正: スマホ時はネガティブマージン (-mx-6等) を使って親要素のpaddingを突き抜ける
    <div className="bg-white md:rounded-xl shadow-sm border-y md:border overflow-hidden text-black -mx-6 md:mx-0">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-3 border-b text-xs md:text-sm font-bold w-16 md:w-20 sticky left-0 bg-slate-50 shadow-[1px_0_0_rgba(0,0,0,0.1)] z-10">時間</th>
              {days.map((day) => (
                <th key={day.toISOString()} className="p-2 md:p-3 border-b border-l text-xs md:text-sm font-bold">
                  {format(day, "M/d", { locale: ja })}
                  <span className="block text-[10px] md:text-xs font-normal text-slate-500">
                    ({format(day, "E", { locale: ja })})
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot.toISOString()} className="hover:bg-blue-50/30 transition-colors">
                <td className="p-2 border-b text-center text-xs md:text-sm font-medium bg-slate-50 sticky left-0 shadow-[1px_0_0_rgba(0,0,0,0.1)] z-10">
                  {format(slot, "HH:00")}
                </td>
                {days.map((day) => {
                  const currentSlot = new Date(day.setHours(slot.getHours()));
                  const isBooked = bookedSlots.some(b => b.getTime() === currentSlot.getTime());
                  const isPast = currentSlot < new Date();

                  return (
                    <td key={currentSlot.toISOString()} className="p-1 border-b border-l text-center">
                      {isBooked || isPast ? (
                        <span className="text-slate-300 text-lg">×</span>
                      ) : (
                        <button
                          onClick={() => onSelectSlot(currentSlot)}
                          className="w-full py-2 md:py-3 rounded bg-blue-50/50 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors font-bold text-lg"
                        >
                          ○
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 bg-slate-50 text-[10px] md:text-xs text-slate-500 flex gap-4 justify-center border-t">
        <span>○：予約可能</span>
        <span>×：予約不可 / 営業時間外</span>
      </div>
    </div>
  );
}