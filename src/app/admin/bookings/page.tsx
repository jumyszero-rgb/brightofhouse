// @/src/app/admin/bookings/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings");
      if (res.ok) setBookings(await res.json());
    } catch (e) {
      console.error("Fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch("/api/admin/bookings", {
      method: "PUT",
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) fetchBookings();
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("本当にこの予約を削除しますか？")) return;
    const res = await fetch("/api/admin/bookings", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchBookings();
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      PENDING: "bg-yellow-100 text-yellow-700",
      CONFIRMED: "bg-blue-100 text-blue-700",
      COMPLETED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    const labels: any = {
      PENDING: "未対応",
      CONFIRMED: "確定済",
      COMPLETED: "完了",
      CANCELLED: "キャンセル",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status] || styles.PENDING}`}>
        {labels[status] || "不明"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">予約管理一覧</h1>
            <p className="text-gray-500 text-sm mt-1">届いた予約申し込みの確認・ステータス管理を行います。</p>
          </div>
          <Link href="/admin" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm font-bold">
            ← メニューへ戻る
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">状態</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">予約日時</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">お客様情報</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">予約メニュー</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">金額/時間</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        {getStatusBadge(b.status)}
                        <select 
                          className="text-[10px] border rounded p-1 bg-white"
                          value={b.status}
                          onChange={(e) => updateStatus(b.id, e.target.value)}
                        >
                          <option value="PENDING">未対応にする</option>
                          <option value="CONFIRMED">確定済にする</option>
                          <option value="COMPLETED">完了にする</option>
                          <option value="CANCELLED">キャンセル</option>
                        </select>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-sm">{format(new Date(b.startTime), "yyyy/MM/dd", {locale:ja})}</p>
                      <p className="text-blue-600 font-bold">{format(new Date(b.startTime), "HH:00")} 〜</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-sm">{b.customerName} 様</p>
                      <p className="text-xs text-gray-500">{b.phone}</p>
                      <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{b.email}</p>
                      {/* ▼ 追加: 住所 */}
                      {b.address && <p className="text-[10px] text-indigo-500 font-bold mt-1">〒 {b.address}</p>}
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-bold text-indigo-600">{b.category}</p>
                      <p className="text-xs text-gray-600 line-clamp-1">{b.items}</p>
                      {/* ▼ 追加: 備考 */}
                      {b.notes && <p className="text-[10px] text-gray-400 mt-1 bg-gray-50 p-1 rounded italic line-clamp-2">備考: {b.notes}</p>}
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-gray-800">¥{b.totalPrice.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400">{b.totalMinutes}分</p>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => deleteBooking(b.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold underline"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && bookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-400">
                      予約データはまだありません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}