// @/src/components/booking/ServicePageBooking.tsx
"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfDay, eachHourOfInterval, setHours, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

type FoldItem = { id: string; title: string; price: number; durationMin: number; durationMax: number; comment?: string };
type MainService = { id?: string; title: string; price: number; durationMin: number; durationMax: number; foldTitle?: string; foldItems?: FoldItem[] };
type OptionService = { id: string; title: string; price: number; durationMin: number; durationMax: number; maxQty?: number; foldTitle?: string; foldItems?: FoldItem[] };

type BookingData = {
  mains?: MainService[];
  main?: { title: string; price: number; duration: number };
  options: OptionService[];
};

type Props = {
  pageTitle: string;
  bookingData: BookingData;
};

export default function ServicePageBooking({ pageTitle, bookingData }: Props) {
  const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({});
  const [selectedMains, setSelectedMains] = useState<number[]>([0]);
  const [selectedFoldItemIds, setSelectedFoldItemIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bookedSlots, setBookedSlots] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [customer, setCustomer] = useState({
    name: "", email: "", phone: "", zip: "", address: "", notes: "", contactMethod: "お電話"
  });

  const mains: MainService[] = bookingData?.mains
    ? bookingData.mains
    : bookingData?.main
      ? [{
          title: bookingData.main.title,
          price: bookingData.main.price,
          durationMin: bookingData.main.duration,
          durationMax: bookingData.main.duration
        }]
      : [];

  const options = (bookingData?.options || []).map(o => ({
    ...o,
    durationMin: o.durationMin || (o as any).duration || 0,
    durationMax: o.durationMax || (o as any).duration || 0,
    maxQty: o.maxQty || 1,
    foldTitle: o.foldTitle || "",
    foldItems: o.foldItems || []
  }));

  const getQty = (id: string) => optionQuantities[id] || 0;
  const setQty = (id: string, qty: number) => {
    setOptionQuantities(prev => ({ ...prev, [id]: qty }));
  };

  const toggleFoldItem = (id: string) => {
    setSelectedFoldItemIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // 合計計算（通常メイン + 折り畳みメイン + 通常オプション + 折り畳みオプション）
  const totalPrice =
    mains.filter((m, idx) => !m.foldTitle && selectedMains.includes(idx)).reduce((sum, m) => sum + (m.price || 0), 0) +
    mains.flatMap(m => (m.foldItems || []).filter(fi => selectedFoldItemIds.includes(fi.id))).reduce((sum, fi) => sum + (fi.price || 0), 0) +
    options.filter(o => !o.foldTitle).reduce((sum, o) => sum + o.price * getQty(o.id), 0) +
    options.flatMap(o => (o.foldItems || []).filter(fi => getQty(fi.id) > 0)).reduce((sum, fi) => sum + fi.price * getQty(fi.id), 0);

  const totalMinutesMin =
    mains.filter((m, idx) => !m.foldTitle && selectedMains.includes(idx)).reduce((sum, m) => sum + (m.durationMin || 0), 0) +
    mains.flatMap(m => (m.foldItems || []).filter(fi => selectedFoldItemIds.includes(fi.id))).reduce((sum, fi) => sum + (fi.durationMin || 0), 0) +
    options.filter(o => !o.foldTitle).reduce((sum, o) => sum + o.durationMin * getQty(o.id), 0) +
    options.flatMap(o => (o.foldItems || []).filter(fi => getQty(fi.id) > 0)).reduce((sum, fi) => sum + fi.durationMin * getQty(fi.id), 0);

  const totalMinutesMax =
    mains.filter((m, idx) => !m.foldTitle && selectedMains.includes(idx)).reduce((sum, m) => sum + (m.durationMax || 0), 0) +
    mains.flatMap(m => (m.foldItems || []).filter(fi => selectedFoldItemIds.includes(fi.id))).reduce((sum, fi) => sum + (fi.durationMax || 0), 0) +
    options.filter(o => !o.foldTitle).reduce((sum, o) => sum + o.durationMax * getQty(o.id), 0) +
    options.flatMap(o => (o.foldItems || []).filter(fi => getQty(fi.id) > 0)).reduce((sum, fi) => sum + fi.durationMax * getQty(fi.id), 0);

  const durationDisplay = totalMinutesMin === totalMinutesMax
    ? `${totalMinutesMin}分`
    : `${totalMinutesMin}〜${totalMinutesMax}分`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resB, resO] = await Promise.all([
          fetch("/api/booking"),
          fetch("/api/admin/calendar")
        ]);
        if (resB.ok) setBookedSlots(await resB.json());
        if (resO.ok) setOverrides(await resO.json());
      } catch (e) { console.error("Fetch error", e); }
    };
    fetchData();
  }, []);

  const handleZipSearch = async (zip: string) => {
    setCustomer({ ...customer, zip });
    if (zip.length === 7) {
      try {
        const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
        const data = await res.json();
        if (data.results) {
          const { address1, address2, address3 } = data.results[0];
          setCustomer(prev => ({ ...prev, address: `${address1}${address2}${address3}` }));
        }
      } catch (e) { console.error("Zip search error", e); }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return alert("日時を選択してください");
    setLoading(true);

    const itemsText = [
      ...mains.filter((m, idx) => !m.foldTitle && selectedMains.includes(idx)).map(m => m.title),
      ...mains.flatMap(m => (m.foldItems || []).filter(fi => selectedFoldItemIds.includes(fi.id)).map(fi => fi.title)),
      ...options.filter(o => !o.foldTitle && getQty(o.id) > 0).map(o => `${o.title} ×${getQty(o.id)}`),
      ...options.flatMap(o => (o.foldItems || []).filter(fi => getQty(fi.id) > 0).map(fi => `${fi.title} ×${getQty(fi.id)}`))
    ].join(", ");

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        body: JSON.stringify({
          category: pageTitle,
          name: customer.name,
          email: customer.email,
          tel: customer.phone,
          address: customer.address,
          notes: `【希望連絡方法: ${customer.contactMethod}】\n${customer.notes}`,
          startTime: selectedDate,
          endTime: new Date(selectedDate.getTime() + totalMinutesMax * 60000),
          items: itemsText,
          totalPrice,
          totalMinutes: totalMinutesMax,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "仮予約、お問い合わせを受け付けました。担当者より確認のご連絡が行きますので少々おまちください。" });
        setSelectedDate(null);
      } else {
        throw new Error();
      }
    } catch (e) {
      setMessage({ type: "error", text: "送信に失敗しました。お電話でご連絡ください。" });
    } finally {
      setLoading(false);
    }
  };

  const [currentWeekStart, setCurrentWeekStart] = useState(startOfDay(new Date()));
  const days = [...Array(7)].map((_, i) => addDays(currentWeekStart, i));
  const timeSlots = eachHourOfInterval({
    start: setHours(startOfDay(new Date()), 9),
    end: setHours(startOfDay(new Date()), 18),
  });

  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const prevWeek = () => {
    const nextStart = addDays(currentWeekStart, -7);
    if (nextStart >= startOfDay(new Date())) setCurrentWeekStart(nextStart);
  };

  if (!bookingData) return null;

  return (
    <div id="booking-section" className="bg-white rounded-3xl shadow-xl border border-blue-100 overflow-hidden text-black scroll-mt-20">
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
          <div className="space-y-3">
            {mains.map((main, idx) => {
              // 折り畳みあり
              if (main.foldTitle && main.foldItems && main.foldItems.length > 0) {
                return (
                  <details key={main.id || idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 font-bold text-blue-700">
                      <span>▼ {main.foldTitle}</span>
                      {main.foldItems.some(fi => selectedFoldItemIds.includes(fi.id)) && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">選択中</span>
                      )}
                    </summary>
                    <div className="p-4 pt-0 space-y-2">
                      {main.foldItems.map(fi => {
                        const checked = selectedFoldItemIds.includes(fi.id);
                        return (
                          <div key={fi.id}>
                            <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${checked ? 'bg-blue-50 border-blue-400' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}>
                              <div className="flex items-center gap-3">
                                <input type="checkbox" checked={checked} onChange={() => toggleFoldItem(fi.id)} className="w-4 h-4 accent-blue-600" />
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
              }

              // 折り畳みなし（元のまま）
              return (
                <label key={idx} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedMains.includes(idx) ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600"
                      checked={selectedMains.includes(idx)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedMains([...selectedMains, idx]);
                        else setSelectedMains(selectedMains.filter(i => i !== idx));
                      }}
                    />
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
            })}

            {/* オプション */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {options.map(opt => {
                // 折り畳みあり
                if (opt.foldTitle && opt.foldItems && opt.foldItems.length > 0) {
                  return (
                    <details key={opt.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden col-span-full">
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
                }

                // 折り畳みなし（元のまま）
                return (
                  <div key={opt.id} className={`p-3 rounded-xl border transition-all ${getQty(opt.id) > 0 ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
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
                      <button type="button" onClick={() => setQty(opt.id, Math.max(0, getQty(opt.id) - 1))} className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center hover:bg-slate-300 transition-colors">−</button>
                      <span className="w-8 text-center font-bold text-lg">{getQty(opt.id)}</span>
                      <button type="button" onClick={() => setQty(opt.id, Math.min(opt.maxQty, getQty(opt.id) + 1))} disabled={getQty(opt.id) >= opt.maxQty} className="w-8 h-8 rounded-full bg-indigo-500 text-white font-bold text-lg flex items-center justify-center hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 transition-colors">+</button>
                      {opt.maxQty > 1 && <span className="text-[10px] text-slate-400">最大{opt.maxQty}個</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 text-right">
            <p className="text-xs text-slate-500">合計作業時間(目安): {durationDisplay}</p>
            <p className="text-2xl font-black text-blue-600">合計：¥{totalPrice.toLocaleString()}<span className="text-sm ml-1 text-slate-500">(税込)</span></p>
          </div>
        </section>

        {/* 2. カレンダー選択 */}
        <section>
          <div className="flex flex-wrap justify-between items-end mb-4 gap-4">
            <h4 className="flex items-center gap-2 font-bold text-lg text-slate-800">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
              希望日時の選択（仮予約・相談）
            </h4>
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
              <button type="button" onClick={prevWeek} disabled={currentWeekStart <= startOfDay(new Date())} className="px-3 py-1 bg-white rounded shadow-sm text-sm font-bold disabled:opacity-30">◀ 前の週</button>
              <span className="px-3 py-1 text-sm font-bold text-slate-600">{format(currentWeekStart, "yyyy年M月")}</span>
              <button type="button" onClick={nextWeek} className="px-3 py-1 bg-white rounded shadow-sm text-sm font-bold">次の週 ▶</button>
            </div>
          </div>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-1 md:p-3 border-b text-[10px] md:text-xs font-bold w-10 md:w-16 sticky left-0 bg-slate-50 z-10 text-black">時間</th>
                  {days.map(day => (
                    <th key={day.toISOString()} className="p-1 md:p-2 border-b border-l text-[10px] md:text-xs font-bold text-center text-black">
                      {format(day, "M/d")}<br/><span className={format(day, "E", {locale:ja}) === "日" ? "text-red-500" : format(day, "E", {locale:ja}) === "土" ? "text-blue-500" : ""}>({format(day, "E", {locale:ja})})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(slot => (
                  <tr key={slot.toISOString()}>
                    <td className="p-1 md:p-2 border-b text-center text-[10px] md:text-xs font-bold bg-slate-50 sticky left-0 z-10 text-black">{format(slot, "HH:00")}</td>
                    {days.map(day => {
                      const current = new Date(day.getFullYear(), day.getMonth(), day.getDate(), slot.getHours(), 0, 0, 0);
                      const isBooked = bookedSlots.some(b => {
                        const start = parseISO(b.startTime);
                        const end = parseISO(b.endTime);
                        return current >= start && current < end;
                      });
                      const override = overrides.find(o => new Date(o.slotTime).getTime() === current.getTime());
                      const manualStatus = override?.status;
                      const isSelected = selectedDate?.getTime() === current.getTime();
                      const isPast = current < new Date();

                      let displayStatus = "○";
                      let isDisabled = false;
                      if (isPast || isBooked || manualStatus === "CLOSED") { displayStatus = "×"; isDisabled = true; }
                      else if (manualStatus === "CONSULT") { displayStatus = "▲"; }

                      return (
                        <td key={current.toISOString()} className={`p-0.5 md:p-1 border-b border-l text-center align-middle ${isSelected ? 'bg-blue-100' : ''}`}>
                          {isDisabled ? (
                            <span className="text-slate-300 font-bold text-lg md:text-2xl inline-block leading-none">×</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedDate(current)}
                              className={`w-full h-10 md:h-12 flex items-center justify-center rounded font-bold text-lg md:text-2xl transition-colors ${isSelected ? 'text-blue-700' : (displayStatus === '▲' ? 'text-orange-400' : 'text-blue-500 hover:bg-blue-50')}`}
                            >
                              {displayStatus}
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
          <div className="flex justify-center gap-4 mt-3 text-[10px] text-slate-500 font-bold">
            <span>○：空きあり</span><span>▲：要相談（お問い合わせください）</span><span>×：満き・店休日</span>
          </div>
          {selectedDate && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-sm font-bold text-blue-800">
                選択日時：{format(selectedDate, "yyyy年MM月dd日 HH:00", {locale:ja})} 〜
              </p>
            </div>
          )}
        </section>

        {/* 3. 顧客情報入力 */}
        <section>
          <h4 className="flex items-center gap-2 font-bold text-lg mb-4 text-slate-800">
            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
            お客様情報の入力
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-2">ご確認のご連絡方法</label>
              <div className="flex flex-wrap gap-4">
                {["お電話", "メール", "SMS"].map(method => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contactMethod"
                      value={method}
                      checked={customer.contactMethod === method}
                      onChange={e => setCustomer({...customer, contactMethod: e.target.value})}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-bold">{method}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="お名前 (必須)" required value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
              <input type="tel" placeholder="電話番号 (必須)" required value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
            </div>
            <input type="email" placeholder="メールアドレス (必須)" required value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="郵便番号 (7桁・自動入力)" maxLength={7} value={customer.zip} onChange={e => handleZipSearch(e.target.value)} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
              <input placeholder="住所" className="md:col-span-2 p-3 border rounded-lg bg-slate-50 text-black" value={customer.address} readOnly />
            </div>
            <textarea placeholder="ご要望・詳細など" rows={3} value={customer.notes} onChange={e => setCustomer({...customer, notes: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />

            <div className="text-center">
              <button type="submit" disabled={loading || !selectedDate} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-300 transition-all text-xl mb-2">
                {loading ? "送信中..." : "この内容で仮予約・相談を申し込む"}
              </button>
              <p className="text-xs text-slate-500 font-bold">後程担当者よりご連絡いたします。</p>
            </div>
          </form>
        </section>

        {message.text && (
          <div className={`p-4 rounded-xl text-center font-bold ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
