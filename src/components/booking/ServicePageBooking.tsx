// @/src/components/booking/ServicePageBooking.tsx
"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type FoldItem = {
  id: string;
  title: string;
  price: number;
  durationMin: number;
  durationMax: number;
  comment: string;
};

type MainService = {
  id: string;
  title: string;
  price: number;
  durationMin: number;
  durationMax: number;
  foldTitle: string;
  foldItems: FoldItem[];
};

type OptionService = {
  id: string;
  title: string;
  price: number;
  durationMin: number;
  durationMax: number;
  maxQty: number;
  foldTitle: string;
  foldItems: FoldItem[];
};

type Props = {
  bookingData: {
    mains: MainService[];
    options: OptionService[];
    main?: { title: string; price: number; duration?: number; durationMin?: number; durationMax?: number };
  };
  pageTitle: string;
};

// 選択可能なアイテム（通常メイン、折り畳み内プラン、通常オプション、折り畳み内オプションプラン）を統一IDで管理
type SelectableItem = {
  uid: string; // ユニークID
  title: string;
  price: number;
  durationMin: number;
  durationMax: number;
  type: "main" | "option";
  maxQty: number;
  comment?: string;
};

export default function ServicePageBooking({ bookingData, pageTitle }: Props) {
  // 旧形式の移行
  const mains: MainService[] = useMemo(() => {
    if (bookingData.mains) return bookingData.mains;
    if (bookingData.main) return [{
      id: "legacy-main",
      title: bookingData.main.title,
      price: bookingData.main.price,
      durationMin: bookingData.main.duration || bookingData.main.durationMin || 60,
      durationMax: bookingData.main.duration || bookingData.main.durationMax || 60,
      foldTitle: "",
      foldItems: []
    }];
    return [];
  }, [bookingData]);

  const options: OptionService[] = useMemo(() => {
    return (bookingData.options || []).map(o => ({
      ...o,
      maxQty: o.maxQty || 1,
      foldTitle: o.foldTitle || "",
      foldItems: o.foldItems || []
    }));
  }, [bookingData]);

  // 全選択可能アイテムをフラット化
  const allSelectables: SelectableItem[] = useMemo(() => {
    const items: SelectableItem[] = [];
    mains.forEach(m => {
      if (m.foldTitle && m.foldItems.length > 0) {
        m.foldItems.forEach(fi => items.push({
          uid: fi.id, title: fi.title, price: fi.price,
          durationMin: fi.durationMin, durationMax: fi.durationMax,
          type: "main", maxQty: 1, comment: fi.comment
        }));
      } else if (!m.foldTitle) {
        items.push({
          uid: m.id, title: m.title, price: m.price,
          durationMin: m.durationMin, durationMax: m.durationMax,
          type: "main", maxQty: 1
        });
      }
    });
    options.forEach(o => {
      if (o.foldTitle && o.foldItems.length > 0) {
        o.foldItems.forEach(fi => items.push({
          uid: fi.id, title: fi.title, price: fi.price,
          durationMin: fi.durationMin, durationMax: fi.durationMax,
          type: "option", maxQty: o.maxQty, comment: fi.comment
        }));
      } else if (!o.foldTitle) {
        items.push({
          uid: o.id, title: o.title, price: o.price,
          durationMin: o.durationMin, durationMax: o.durationMax,
          type: "option", maxQty: o.maxQty
        });
      }
    });
    return items;
  }, [mains, options]);

  // 選択状態: メインはチェック(boolean)、オプションは個数(number)
  const [selectedMainIds, setSelectedMainIds] = useState<string[]>([]);
  const [optionQtys, setOptionQtys] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", zip: "", address: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const toggleMain = (uid: string) => {
    setSelectedMainIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  const getQty = (uid: string) => optionQtys[uid] || 0;
  const setQty = (uid: string, qty: number) => setOptionQtys(prev => ({ ...prev, [uid]: qty }));

  // 合計計算
  const totals = useMemo(() => {
    let price = 0, durMin = 0, durMax = 0;
    const summaryItems: string[] = [];

    selectedMainIds.forEach(uid => {
      const item = allSelectables.find(s => s.uid === uid && s.type === "main");
      if (item) { price += item.price; durMin += item.durationMin; durMax += item.durationMax; summaryItems.push(item.title); }
    });

    Object.entries(optionQtys).forEach(([uid, qty]) => {
      if (qty <= 0) return;
      const item = allSelectables.find(s => s.uid === uid && s.type === "option");
      if (item) { price += item.price * qty; durMin += item.durationMin * qty; durMax += item.durationMax * qty; summaryItems.push(`${item.title}×${qty}`); }
    });

    return { price, durMin, durMax, summaryItems };
  }, [selectedMainIds, optionQtys, allSelectables]);

  const durationDisplay = totals.durMin === totals.durMax ? `${totals.durMin}分` : `${totals.durMin}〜${totals.durMax}分`;

  // 郵便番号検索
  const handleZipSearch = async (zip: string) => {
    setCustomer(prev => ({ ...prev, zip }));
    if (zip.length === 7) {
      try {
        const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
        const data = await res.json();
        if (data.results?.[0]) {
          const r = data.results[0];
          setCustomer(prev => ({ ...prev, address: `${r.address1}${r.address2}${r.address3}` }));
        }
      } catch {}
    }
  };

  // カレンダー
  const generateCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return { days, today };
  };

  const timeSlots = [9, 10, 11, 12, 13, 14, 15, 16, 17];

  // 送信
  const handleSubmit = async () => {
    if (totals.summaryItems.length === 0) return alert("サービスを選択してください");
    if (!selectedDate) return alert("日時を選択してください");
    if (!customer.name || !customer.phone || !customer.email) return alert("お名前・電話番号・メールアドレスは必須です");
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageTitle,
          services: totals.summaryItems,
          totalPrice: totals.price,
          totalDuration: `${durationDisplay}`,
          date: selectedDate.toISOString(),
          customer,
        }),
      });
      if (!res.ok) throw new Error("送信失敗");
      setDone(true);
    } catch (e: any) { alert(e.message); } finally { setSubmitting(false); }
  };

  if (done) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">仮予約を受け付けました</h3>
        <p className="text-sm text-slate-600">24時間以内に担当者よりご連絡いたします。</p>
      </div>
    );
  }

  const { days, today } = generateCalendarDays();

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-blue-600 p-6 text-white text-center">
        <h3 className="text-xl font-bold">ネットで即時見積・仮予約・このサービスについてのお問い合わせ</h3>
        <p className="text-blue-100 text-xs mt-2 whitespace-pre-wrap leading-relaxed">
          ※お問い合わせの場合も日時を選択お願いします。{"\n"}
          お問い合わせ段階では作業の確定ではございませんのでお気軽にお問い合わせください。
        </p>
      </div>

      <div className="p-6 md:p-10 space-y-10">

        {/* LINE案内 */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
          <img src="/images/line-qr.JPG" alt="LINE QRコード" className="w-20 h-20 rounded-lg border" />
          <div>
            <p className="font-bold text-green-700 text-sm">LINEでもお問い合わせ可能です</p>
            <p className="text-xs text-slate-600 mt-1">スマホでQRコードを読み取ってお気軽にご相談ください。</p>
          </div>
        </div>

        {/* 1. メニュー選択 */}
        <section>
          <h4 className="flex items-center gap-2 font-bold text-lg mb-4 text-slate-800">
            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
            作業メニューの選択
          </h4>

          {/* メインサービス */}
          <div className="space-y-3 mb-6">
            {mains.map(main => {
              // 折り畳みなし → チェックボックス1つ
              if (!main.foldTitle) {
                const checked = selectedMainIds.includes(main.id);
                return (
                  <label key={main.id} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${checked ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={checked} onChange={() => toggleMain(main.id)} className="w-5 h-5 accent-blue-600" />
                      <div>
                        <span className="font-bold">{main.title}</span>
                        <span className="text-xs text-slate-500 ml-2">
                          ({main.durationMin === main.durationMax ? `${main.durationMin}分` : `${main.durationMin}〜${main.durationMax}分`})
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-blue-600">¥{main.price.toLocaleString()}</span>
                  </label>
                );
              }

              // 折り畳みあり → detailsで開閉、中に複数チェックボックス
              return (
                <details key={main.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 font-bold text-blue-700">
                    <span>▼ {main.foldTitle}</span>
                    {main.foldItems.some(fi => selectedMainIds.includes(fi.id)) && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">選択中</span>
                    )}
                  </summary>
                  <div className="p-4 pt-0 space-y-2">
                    {main.foldItems.map(fi => {
                      const checked = selectedMainIds.includes(fi.id);
                      return (
                        <div key={fi.id}>
                          <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${checked ? 'bg-blue-50 border-blue-400' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}>
                            <div className="flex items-center gap-3">
                              <input type="checkbox" checked={checked} onChange={() => toggleMain(fi.id)} className="w-4 h-4 accent-blue-600" />
                              <div>
                                <span className="font-bold text-sm">{fi.title}</span>
                                <span className="text-xs text-slate-500 ml-2">
                                  ({fi.durationMin === fi.durationMax ? `${fi.durationMin}分` : `${fi.durationMin}〜${fi.durationMax}分`})
                                </span>
                              </div>
                            </div>
                            <span className="font-bold text-blue-600 text-sm">¥{fi.price.toLocaleString()}</span>
                          </label>
                          {fi.comment && <p className="text-xs text-slate-500 ml-8 mt-1">💬 {fi.comment}</p>}
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>

          {/* オプション */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-slate-600 mb-2">追加オプション</p>
            {options.map(opt => {
              // 折り畳みなし
              if (!opt.foldTitle) {
                const qty = getQty(opt.id);
                return (
                  <div key={opt.id} className={`p-3 rounded-xl border transition-all ${qty > 0 ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium">{opt.title}</span>
                        <span className="text-[10px] text-slate-400 ml-1">
                          (+{opt.durationMin === opt.durationMax ? `${opt.durationMin}分` : `${opt.durationMin}〜${opt.durationMax}分`})
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-600">+¥{opt.price.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setQty(opt.id, Math.max(0, qty - 1))} className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center hover:bg-slate-300">−</button>
                      <span className="w-8 text-center font-bold text-lg">{qty}</span>
                      <button type="button" onClick={() => setQty(opt.id, Math.min(opt.maxQty, qty + 1))} disabled={qty >= opt.maxQty} className="w-8 h-8 rounded-full bg-indigo-500 text-white font-bold text-lg flex items-center justify-center hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400">+</button>
                      {opt.maxQty > 1 && <span className="text-[10px] text-slate-400">最大{opt.maxQty}個</span>}
                    </div>
                  </div>
                );
              }

              // 折り畳みあり
              return (
                <details key={opt.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 font-bold text-indigo-700">
                    <span>▼ {opt.foldTitle}</span>
                    {opt.foldItems.some(fi => getQty(fi.id) > 0) && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">選択中</span>
                    )}
                  </summary>
                  <div className="p-4 pt-0 space-y-2">
                    {opt.foldItems.map(fi => {
                      const qty = getQty(fi.id);
                      return (
                        <div key={fi.id}>
                          <div className={`p-3 rounded-lg border transition-all ${qty > 0 ? 'bg-indigo-50 border-indigo-400' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="text-sm font-medium">{fi.title}</span>
                                <span className="text-[10px] text-slate-400 ml-1">
                                  (+{fi.durationMin === fi.durationMax ? `${fi.durationMin}分` : `${fi.durationMin}〜${fi.durationMax}分`})
                                </span>
                              </div>
                              <span className="text-sm font-bold text-slate-600">+¥{fi.price.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => setQty(fi.id, Math.max(0, qty - 1))} className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-300">−</button>
                              <span className="w-6 text-center font-bold">{qty}</span>
                              <button type="button" onClick={() => setQty(fi.id, Math.min(opt.maxQty, qty + 1))} disabled={qty >= opt.maxQty} className="w-7 h-7 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400">+</button>
                              {opt.maxQty > 1 && <span className="text-[10px] text-slate-400">最大{opt.maxQty}</span>}
                            </div>
                          </div>
                          {fi.comment && <p className="text-xs text-slate-500 ml-4 mt-1">💬 {fi.comment}</p>}
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
            {options.length === 0 && <p className="text-xs text-slate-400 text-center py-2">オプションはありません</p>}
          </div>

          {/* 合計 */}
          {totals.summaryItems.length > 0 && (
            <div className="mt-4 bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">合計見積</span>
                <span className="text-2xl font-black text-blue-700">¥{totals.price.toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-500">合計作業時間(目安): {durationDisplay}</p>
            </div>
          )}
        </section>

        {/* 2. カレンダー選択 */}
        <section>
          <h4 className="flex items-center gap-2 font-bold text-lg mb-4 text-slate-800">
            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
            希望日時の選択（仮予約・相談）
          </h4>

          <div className="border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between bg-slate-100 p-3">
              <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} className="px-3 py-1 bg-white rounded border text-sm font-bold">◀</button>
              <span className="font-bold">{format(calendarMonth, "yyyy年MM月", { locale: ja })}</span>
              <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} className="px-3 py-1 bg-white rounded border text-sm font-bold">▶</button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-500 border-b">
              {["日", "月", "火", "水", "木", "金", "土"].map(d => <div key={d} className="py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 text-center">
              {days.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="py-3" />;
                const isPast = day < today;
                const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString() && !selectedDate.getHours();
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={isPast}
                    onClick={() => setSelectedDate(day)}
                    className={`py-3 text-sm transition-all ${isPast ? 'text-slate-300' : 'hover:bg-blue-50 cursor-pointer'} ${isSelected ? 'bg-blue-600 text-white font-bold rounded' : ''}`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDate && !selectedDate.getHours() && (
            <div className="mt-4">
              <p className="text-sm font-bold mb-2 text-slate-700">時間帯を選択：</p>
              <div className="flex flex-wrap gap-2">
                {timeSlots.map(hour => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => {
                      const d = new Date(selectedDate);
                      d.setHours(hour, 0, 0, 0);
                      setSelectedDate(d);
                    }}
                    className="px-4 py-2 border rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors"
                  >
                    {hour}:00
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedDate && selectedDate.getHours() > 0 && (
            <div className="mt-3 bg-blue-50 p-3 rounded-xl border border-blue-200">
              <p className="text-sm font-bold text-blue-700">
                選択日時：{format(selectedDate, "yyyy年MM月dd日 HH:00", { locale: ja })} 〜
              </p>
            </div>
          )}
        </section>

        {/* 3. お客様情報 */}
        <section>
          <h4 className="flex items-center gap-2 font-bold text-lg mb-4 text-slate-800">
            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
            お客様情報
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input placeholder="お名前 (必須)" required value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
              <input type="tel" placeholder="電話番号 (必須)" required value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
            </div>
            <input type="email" placeholder="メールアドレス (必須)" required value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input placeholder="郵便番号 (7桁・自動入力)" maxLength={7} value={customer.zip} onChange={e => handleZipSearch(e.target.value)} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
              <input placeholder="住所" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
            </div>
            <textarea placeholder="ご要望・詳細など" rows={3} value={customer.notes} onChange={e => setCustomer({ ...customer, notes: e.target.value })} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
          </div>
        </section>

        {/* 送信ボタン */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {submitting ? "送信中..." : "仮予約・お問い合わせを送信する"}
        </button>
      </div>
    </div>
  );
}
