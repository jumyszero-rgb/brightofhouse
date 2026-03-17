// @/src/components/BookingCalendar.tsx
"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfDay, eachHourOfInterval, setHours, isSameDay, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

type Props = {
  category: string;
  onSelectSlot: (date: Date) => void;
};

export default function BookingCalendar({ category, onSelectSlot }: Props) {
  const [bookedSlots, setBookedSlots] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 予約済みデータの取得
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

  // 今日から7日分の表示
  const days = [...Array(7)].map((_, i) => addDays(startOfDay(new Date()), i));
  
  // 営業時間 9:00 - 18:00
  const timeSlots = eachHourOfInterval({
    start: setHours(startOfDay(new Date()), 9),
    end: setHours(startOfDay(new Date()), 18),
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-x-auto text-black">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50">
            <th className="p-3 border text-sm font-bold w-20">時間</th>
            {days.map((day) => (
              <th key={day.toISOString()} className="p-3 border text-sm font-bold min-w-[100px]">
                {format(day, "M/d", { locale: ja })}
                <span className="block text-xs font-normal text-slate-500">
                  ({format(day, "E", { locale: ja })})
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((slot) => (
            <tr key={slot.toISOString()}>
              <td className="p-2 border text-center text-sm font-medium bg-slate-50">
                {format(slot, "HH:00")}
              </td>
              {days.map((day) => {
                const currentSlot = new Date(day.setHours(slot.getHours()));
                const isBooked = bookedSlots.some(b => b.getTime() === currentSlot.getTime());
                const isPast = currentSlot < new Date();

                return (
                  <td key={currentSlot.toISOString()} className="p-1 border text-center">
                    {isBooked || isPast ? (
                      <span className="text-slate-300 text-lg">×</span>
                    ) : (
                      <button
                        onClick={() => onSelectSlot(currentSlot)}
                        className="w-full py-2 rounded bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors font-bold text-lg"
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
      <div className="p-4 bg-slate-50 text-xs text-slate-500 flex gap-4 justify-center">
        <span>○：予約可能</span>
        <span>×：予約不可 / 営業時間外</span>
      </div>
    </div>
  );
}