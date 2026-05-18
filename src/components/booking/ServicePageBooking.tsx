// @/src/components/booking/ServicePageBooking.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { format, addDays, startOfDay, eachHourOfInterval, setHours, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

type FoldItem = { id: string; title: string; price: number; durationMin: number; durationMax: number; comment?: string; cautionNote?: string };

type OptionItem = {
  id: string; title: string; price: number; durationMin: number; durationMax: number;
  maxQty: number; comment?: string; parentFoldItemId?: string;
};

type DiscountRule = { count: number; value: number };
type SetDiscount = { enabled: boolean; type: "amount" | "percent"; rules: DiscountRule[] };

type MainService = {
  id?: string; title: string; price: number; durationMin: number; durationMax: number;
  foldTitle?: string; foldItems?: FoldItem[];
  options?: OptionItem[];
  setDiscount?: SetDiscount;
};

type LegacyOptionService = {
  id: string; title: string; price: number; durationMin: number; durationMax: number;
  maxQty?: number; foldTitle?: string; foldItems?: FoldItem[];
};

type BookingData = {
  mains?: MainService[];
  main?: { title: string; price: number; duration: number };
  options?: LegacyOptionService[];
};

type Props = {
  pageTitle: string;
  bookingData: BookingData;
};

export default function ServicePageBooking({ pageTitle, bookingData }: Props) {
  const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({});
  const [selectedMains, setSelectedMains] = useState<number[]>([0]);
  const [selectedFoldItemIds, setSelectedFoldItemIds] = useState<string[]>([]);
  const [openFolds, setOpenFolds] = useState<Record<string, boolean>>({});
  const toggleFold = (id: string) => setOpenFolds(prev => ({ ...prev, [id]: !prev[id] }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bookedSlots, setBookedSlots] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [customer, setCustomer] = useState({
    name: "", email: "", phone: "", zip: "", address: "", notes: "", contactMethod: "お電話"
  });

  const [nightWork, setNightWork] = useState(false);
  const [calendarStartHour, setCalendarStartHour] = useState(5);
  const [calendarEndHour, setCalendarEndHour] = useState(22);
  const [openCautions, setOpenCautions] = useState<Record<string, boolean>>({});
  const toggleCaution = (id: string) => setOpenCautions(prev => ({ ...prev, [id]: !prev[id] }));

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

  const legacyOptions = (bookingData?.options || []).map(o => ({
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

  // セット値引き計算
  const calcSetDiscount = (main: MainService): number => {
    if (!main.setDiscount?.enabled || !main.foldItems) return 0;
    const selectedCount = main.foldItems.filter(fi => selectedFoldItemIds.includes(fi.id)).length;
    if (selectedCount < 2) return 0;

    const rules = [...(main.setDiscount.rules || [])].sort((a, b) => b.count - a.count);
    const matchedRule = rules.find(r => selectedCount >= r.count);
    if (!matchedRule) return 0;

    if (main.setDiscount.type === "amount") {
      return matchedRule.value;
    } else {
      const subtotal = main.foldItems
        .filter(fi => selectedFoldItemIds.includes(fi.id))
        .reduce((sum, fi) => sum + (fi.price || 0), 0);
      return Math.floor(subtotal * matchedRule.value / 100);
    }
  };

  const totalSetDiscount = mains.reduce((sum, m) => sum + calcSetDiscount(m), 0);

  // 合計計算
  const mainNoFoldPrice = mains.filter((m, idx) => !m.foldTitle && selectedMains.includes(idx)).reduce((sum, m) => sum + (m.price || 0), 0);
  const mainFoldPrice = mains.flatMap(m => (m.foldItems || []).filter(fi => selectedFoldItemIds.includes(fi.id))).reduce((sum, fi) => sum + (fi.price || 0), 0);
  const mainOptionPrice = mains.flatMap(m => (m.options || []).filter(o => getQty(o.id) > 0)).reduce((sum, o) => sum + o.price * getQty(o.id), 0);
  const legacyNoFoldPrice = legacyOptions.filter(o => !o.foldTitle).reduce((sum, o) => sum + o.price * getQty(o.id), 0);
  const legacyFoldPrice = legacyOptions.flatMap(o => (o.foldItems || []).filter(fi => getQty(fi.id) > 0)).reduce((sum, fi) => sum + fi.price * getQty(fi.id), 0);
  const totalPrice = mainNoFoldPrice + mainFoldPrice + mainOptionPrice + legacyNoFoldPrice + legacyFoldPrice - totalSetDiscount;
  // 合計時間計算
  const mainNoFoldMinMin = mains.filter((m, idx) => !m.foldTitle && selectedMains.includes(idx)).reduce((sum, m) => sum + (m.durationMin || 0), 0);
  const mainFoldMinMin = mains.flatMap(m => (m.foldItems || []).filter(fi => selectedFoldItemIds.includes(fi.id))).reduce((sum, fi) => sum + (fi.durationMin || 0), 0);
  const mainOptionMinMin = mains.flatMap(m => (m.options || []).filter(o => getQty(o.id) > 0)).reduce((sum, o) => sum + o.durationMin * getQty(o.id), 0);
  const legacyNoFoldMinMin = legacyOptions.filter(o => !o.foldTitle).reduce((sum, o) => sum + o.durationMin * getQty(o.id), 0);
  const legacyFoldMinMin = legacyOptions.flatMap(o => (o.foldItems || []).filter(fi => getQty(fi.id) > 0)).reduce((sum, fi) => sum + fi.durationMin * getQty(fi.id), 0);
  const totalMinutesMin = mainNoFoldMinMin + mainFoldMinMin + mainOptionMinMin + legacyNoFoldMinMin + legacyFoldMinMin;

  const mainNoFoldMinMax = mains.filter((m, idx) => !m.foldTitle && selectedMains.includes(idx)).reduce((sum, m) => sum + (m.durationMax || 0), 0);
  const mainFoldMinMax = mains.flatMap(m => (m.foldItems || []).filter(fi => selectedFoldItemIds.includes(fi.id))).reduce((sum, fi) => sum + (fi.durationMax || 0), 0);
  const mainOptionMinMax = mains.flatMap(m => (m.options || []).filter(o => getQty(o.id) > 0)).reduce((sum, o) => sum + o.durationMax * getQty(o.id), 0);
  const legacyNoFoldMinMax = legacyOptions.filter(o => !o.foldTitle).reduce((sum, o) => sum + o.durationMax * getQty(o.id), 0);
  const legacyFoldMinMax = legacyOptions.flatMap(o => (o.foldItems || []).filter(fi => getQty(fi.id) > 0)).reduce((sum, fi) => sum + fi.durationMax * getQty(fi.id), 0);
  const totalMinutesMax = mainNoFoldMinMax + mainFoldMinMax + mainOptionMinMax + legacyNoFoldMinMax + legacyFoldMinMax;

  const durationDisplay = totalMinutesMin === totalMinutesMax
    ? `${totalMinutesMin}分`
    : `${totalMinutesMin}〜${totalMinutesMax}分`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resB, resO, resS] = await Promise.all([
          fetch("/api/booking"),
          fetch("/api/admin/calendar"),
          fetch("/api/settings"),
        ]);
        if (resB.ok) setBookedSlots(await resB.json());
        if (resO.ok) setOverrides(await resO.json());
        if (resS.ok) {
          const settings = await resS.json();
          setCalendarStartHour(settings.calendarStartHour ?? 5);
          setCalendarEndHour(settings.calendarEndHour ?? 22);
        }
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

    const itemsText = [
      ...mains.filter((m, idx) => !m.foldTitle && selectedMains.includes(idx)).map(m => m.title),
      ...mains.flatMap(m => (m.foldItems || []).filter(fi => selectedFoldItemIds.includes(fi.id)).map(fi => fi.title)),
      ...mains.flatMap(m => (m.options || []).filter(o => getQty(o.id) > 0).map(o => `${o.title} ×${getQty(o.id)}`)),
      ...legacyOptions.filter(o => !o.foldTitle && getQty(o.id) > 0).map(o => `${o.title} ×${getQty(o.id)}`),
      ...legacyOptions.flatMap(o => (o.foldItems || []).filter(fi => getQty(fi.id) > 0).map(fi => `${fi.title} ×${getQty(fi.id)}`))
    ].join(", ");

    if (!itemsText) {
      alert("作業メニューを1つ以上選択してください。");
      return;
    }
    if (!customer.contactMethod) {
      alert("ご連絡方法を選択してください。");
      return;
    }

    const discountNotes = mains.map(m => {
      const disc = calcSetDiscount(m);
      if (disc > 0) {
        const count = (m.foldItems || []).filter(fi => selectedFoldItemIds.includes(fi.id)).length;
        return `【${m.foldTitle || m.title} ${count}点セット値引き: -¥${disc.toLocaleString()}】`;
      }
      return "";
    }).filter(Boolean).join("\n");

    setLoading(true);

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: pageTitle,
          name: customer.name,
          email: customer.email,
          tel: customer.phone,
          zip: customer.zip,
          address: customer.address,
          contactMethod: customer.contactMethod,
          notes: [
            nightWork ? "【深夜帯作業希望】" : "",
            discountNotes,
            customer.notes,
          ].filter(Boolean).join("\n"),
          startTime: format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss"),
          endTime: format(new Date(selectedDate.getTime() + totalMinutesMax * 60000), "yyyy-MM-dd'T'HH:mm:ss"),
          items: itemsText,
          totalPrice,
          totalMinutes: `${totalMinutesMin}〜${totalMinutesMax}`,
        }),
      });

      if (res.ok) {
        window.location.href = "/thank-you";
        return;
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
    start: setHours(startOfDay(new Date()), calendarStartHour),
    end: setHours(startOfDay(new Date()), calendarEndHour - 1),
  });

  const calendarRef = useRef<HTMLDivElement>(null);

  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const prevWeek = () => {
    const nextStart = addDays(currentWeekStart, -7);
    if (nextStart >= startOfDay(new Date())) setCurrentWeekStart(nextStart);
  };

  if (!bookingData) return null;
  return (
    <div id="booking-section" className="bg-white rounded-3xl shadow-xl border border-blue-100 overflow-hidden text-black scroll-mt-24">
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
              // ===== 折り畳みあり =====
              if (main.foldTitle && main.foldItems && main.foldItems.length > 0) {
                const foldKey = main.id || `main-fold-${idx}`;
                const selectedInThisMain = main.foldItems.filter(fi => selectedFoldItemIds.includes(fi.id));
                const discount = calcSetDiscount(main);
                return (
                  <div key={foldKey} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <button type="button" onClick={() => toggleFold(foldKey)} className="flex items-center justify-between w-full p-4 cursor-pointer hover:bg-slate-50 font-bold text-blue-700 focus:outline-none">
                      <span>{openFolds[foldKey] ? "▲" : "▼"} {main.foldTitle}</span>
                      <div className="flex items-center gap-2">
                        {selectedInThisMain.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{selectedInThisMain.length}件選択中</span>
                        )}
                        {discount > 0 && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">-¥{discount.toLocaleString()}引き</span>
                        )}
                      </div>
                    </button>
                    {openFolds[foldKey] && (
                      <div className="p-4 pt-0 space-y-2">
                        {/* セット値引き案内 */}
                        {main.setDiscount?.enabled && main.setDiscount.rules.length > 0 && (
                          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3 mb-2">
                            <p className="text-xs font-bold text-red-700 mb-1">🎉 セット値引き</p>
                            <div className="flex flex-wrap gap-2">
                              {main.setDiscount.rules.sort((a, b) => a.count - b.count).map(rule => (
                                <span key={rule.count} className={`text-[10px] px-2 py-1 rounded-full font-bold ${selectedInThisMain.length >= rule.count ? 'bg-red-600 text-white' : 'bg-white text-red-600 border border-red-300'}`}>
                                  {rule.count}点で{main.setDiscount!.type === "amount" ? `¥${rule.value.toLocaleString()}引き` : `${rule.value}%引き`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {main.foldItems.map(fi => {
                          const checked = selectedFoldItemIds.includes(fi.id);
                          const fiOptions = (main.options || []).filter(o => o.parentFoldItemId === fi.id);
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

                              {/* 注意事項（折り畳み） */}
                              {fi.cautionNote && (
                                <div className="ml-8 mt-1">
                                  <button type="button" onClick={() => toggleCaution(fi.id)} className="text-[10px] font-bold text-red-600 hover:underline">
                                    {openCautions[fi.id] ? "▲ 注意事項を閉じる" : "⚠️ 注意事項を確認"}
                                  </button>
                                  {openCautions[fi.id] && (
                                    <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 whitespace-pre-wrap">
                                      {fi.cautionNote}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* このfoldItemに紐づくオプション（チェック時のみ表示） */}
                              {checked && fiOptions.length > 0 && (
                                <div className="ml-8 mt-2 mb-2 pl-3 border-l-4 border-indigo-200 space-y-1">
                                  <p className="text-[10px] font-bold text-indigo-600">┗ オプション</p>
                                  {fiOptions.map(opt => {
                                    const qty = getQty(opt.id);
                                    return (
                                      <div key={opt.id}>
                                        <div className={`p-2 rounded-lg border transition-all ${qty > 0 ? 'bg-indigo-50 border-indigo-400' : 'bg-slate-50 border-slate-200'}`}>
                                          <div className="flex items-center justify-between mb-1">
                                            <div>
                                              <span className="text-xs font-medium">{opt.title}</span>
                                              <span className="text-[10px] text-slate-400 ml-1">
                                                (+{opt.durationMin === opt.durationMax ? `${opt.durationMin}分` : `${opt.durationMin}〜${opt.durationMax}分`})
                                              </span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-600">+¥{opt.price.toLocaleString()}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => setQty(opt.id, Math.max(0, qty - 1))} className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center hover:bg-slate-300">−</button>
                                            <span className="w-5 text-center font-bold text-xs">{qty}</span>
                                            <button type="button" onClick={() => setQty(opt.id, Math.min(opt.maxQty || 99, qty + 1))} disabled={qty >= (opt.maxQty || 99)} className="w-6 h-6 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400">+</button>
                                            {(opt.maxQty || 0) > 1 && <span className="text-[10px] text-slate-400">最大{opt.maxQty}</span>}
                                          </div>
                                        </div>
                                        {opt.comment && <p className="text-[10px] text-slate-500 ml-2 mt-0.5">💬 {opt.comment}</p>}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* 値引き適用表示 */}
                        {discount > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                            <p className="text-sm font-bold text-red-600">🎉 {selectedInThisMain.length}点セット値引き適用中：-¥{discount.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              // ===== 折り畳みなし =====
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

            {/* 旧オプション（後方互換） */}
            {legacyOptions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {legacyOptions.map((opt, optIdx) => {
                  if (opt.foldTitle && opt.foldItems && opt.foldItems.length > 0) {
                    const foldKey = opt.id || `opt-fold-${optIdx}`;
                    return (
                      <div key={foldKey} className="bg-white border border-slate-200 rounded-xl overflow-hidden col-span-full">
                        <button type="button" onClick={() => toggleFold(foldKey)} className="flex items-center justify-between w-full p-4 cursor-pointer hover:bg-slate-50 font-bold text-indigo-700 focus:outline-none">
                          <span>{openFolds[foldKey] ? "▲" : "▼"} {opt.foldTitle}</span>
                          {opt.foldItems.some(fi => getQty(fi.id) > 0) && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">選択中</span>
                          )}
                        </button>
                        {openFolds[foldKey] && (
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
                                      <button type="button" onClick={() => setQty(fi.id, Math.min(opt.maxQty || 99, qty + 1))} disabled={qty >= (opt.maxQty || 99)} className="w-7 h-7 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400">+</button>
                                      {(opt.maxQty || 0) > 1 && <span className="text-[10px] text-slate-400">最大{opt.maxQty}</span>}
                                    </div>
                                  </div>
                                  {fi.comment && <p className="text-xs text-slate-500 ml-4 mt-1">💬 {fi.comment}</p>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

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
                        <button type="button" onClick={() => setQty(opt.id, Math.min(opt.maxQty || 99, getQty(opt.id) + 1))} disabled={getQty(opt.id) >= (opt.maxQty || 99)} className="w-8 h-8 rounded-full bg-indigo-500 text-white font-bold text-lg flex items-center justify-center hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 transition-colors">+</button>
                        {(opt.maxQty || 0) > 1 && <span className="text-[10px] text-slate-400">最大{opt.maxQty}個</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 合計表示 */}
          <div className="mt-4 text-right">
            <p className="text-xs text-slate-500">合計作業時間(目安): {durationDisplay}</p>
            {totalSetDiscount > 0 && (
              <p className="text-sm text-red-600 font-bold">セット値引き：-¥{totalSetDiscount.toLocaleString()}</p>
            )}
            <p className="text-2xl font-black text-blue-600">合計：¥{totalPrice.toLocaleString()}<span className="text-sm ml-1 text-slate-500">(税込)</span></p>
          </div>
        </section>
        {/* 2. カレンダー選択 */}
        <section>
          <div className="flex flex-wrap justify-between items-end mb-4 gap-4">
            <h4 className="flex items-center gap-2 font-bold text-lg text-slate-800">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
              ご希望の日時を選択
            </h4>
            <div className="flex items-center gap-2">
              <button type="button" onClick={prevWeek} className="px-3 py-1 bg-slate-200 rounded-lg text-sm font-bold hover:bg-slate-300">← 前週</button>
              <span className="text-sm font-bold text-slate-600">{format(currentWeekStart, "yyyy年M月", { locale: ja })}</span>
              <button type="button" onClick={nextWeek} className="px-3 py-1 bg-slate-200 rounded-lg text-sm font-bold hover:bg-slate-300">翌週 →</button>
            </div>
          </div>

          <div ref={calendarRef} className="overflow-x-auto overflow-y-auto max-h-[480px] -mx-4 md:mx-0 scroll-smooth">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="p-2 text-xs text-slate-500 bg-slate-50 sticky top-0 z-10">時間</th>
                  {days.map(day => {
                    const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                    const dow = day.getDay();
                    return (
                      <th key={day.toISOString()} className={`p-2 text-xs sticky top-0 z-10 ${isToday ? 'bg-blue-100 text-blue-700' : dow === 0 ? 'bg-red-50 text-red-600' : dow === 6 ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'}`}>
                        {format(day, "M/d(E)", { locale: ja })}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(slot => {
                  const hour = slot.getHours();
                  return (
                    <tr key={hour}>
                      <td className="p-2 text-xs text-slate-500 text-center border-t font-bold whitespace-nowrap">{hour}:00</td>
                      {days.map(day => {
                        const current = setHours(startOfDay(day), hour);
                        const isPast = current < new Date();
                        const isBooked = bookedSlots.some(b => {
                          const s = new Date(b.startTime);
                          const e = new Date(b.endTime);
                          return current >= s && current < e;
                        });

                        const override = overrides.find((o: any) => {
                          if (o.date && o.hour !== undefined) {
                            return o.date === format(day, "yyyy-MM-dd") && o.hour === hour;
                          }
                          if (o.slotTime) {
                            const st = new Date(o.slotTime);
                            return st.getUTCFullYear() === current.getFullYear()
                              && st.getUTCMonth() === current.getMonth()
                              && st.getUTCDate() === current.getDate()
                              && st.getUTCHours() === hour;
                          }
                          return false;
                        });
                        const manualStatus = override?.status;


                        const isUnavailable = isPast || isBooked || manualStatus === "CLOSED";
                        const isConsult = manualStatus === "CONSULT";
                        const isSelected = selectedDate?.getTime() === current.getTime();

                        let display = "○";
                        let color = "text-emerald-500 hover:bg-emerald-50";
                        if (isUnavailable) { display = "×"; color = "text-slate-300"; }
                        else if (isConsult) { display = "▲"; color = "text-amber-500 hover:bg-amber-50"; }
                        if (isSelected) { color = "bg-blue-600 text-white font-black"; }

                        return (
                          <td key={day.toISOString() + hour} className="border-t text-center">
                            <button
                              type="button"
                              disabled={isUnavailable}
                              className={`w-full py-2 text-sm font-bold rounded transition-all ${color} ${isUnavailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                              onClick={() => setSelectedDate(current)}
                            >
                              {display}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedDate && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="font-bold text-blue-700 text-center">
                選択日時：{format(selectedDate, "yyyy年MM月dd日 HH:00", { locale: ja })} 〜
              </p>
            </div>
          )}

          {/* 深夜帯・時間外案内 */}
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-600 text-center mb-2">
              上記カレンダーは {calendarStartHour}:00〜{calendarEndHour}:00 の時間帯を表示しています。<br />
              それ以外のお時間帯をご希望の場合はお気軽にご相談ください。
            </p>
            <label className="flex items-center justify-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={nightWork}
                onChange={() => setNightWork(!nightWork)}
                className="w-4 h-4 accent-purple-600"
              />
              <span className="text-sm font-bold text-purple-700">深夜帯作業のお問い合わせをする</span>
            </label>
            {nightWork && (
              <p className="text-xs text-purple-600 text-center mt-2 font-bold">
                ※深夜帯の作業をご希望の場合は、備考欄にご希望の時間帯をご記入ください。<br />
                担当者より折り返しご連絡いたします。
              </p>
            )}
          </div>
        </section>

        {/* 3. お客様情報 */}
        <section>
          <h4 className="flex items-center gap-2 font-bold text-lg mb-4 text-slate-800">
            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
            お客様情報の入力
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">お名前 <span className="text-red-500">*</span></label>
              <input required value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} className="w-full p-3 border rounded-xl" placeholder="例：山田 太郎" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">メールアドレス <span className="text-red-500">*</span></label>
              <input required type="email" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} className="w-full p-3 border rounded-xl" placeholder="例：example@mail.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">電話番号 <span className="text-red-500">*</span></label>
              <input required type="tel" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} className="w-full p-3 border rounded-xl" placeholder="例：090-1234-5678" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">郵便番号</label>
              <input value={customer.zip} onChange={e => handleZipSearch(e.target.value.replace(/[^0-9]/g, ""))} className="w-full p-3 border rounded-xl" placeholder="例：0600000（ハイフンなし7桁）" maxLength={7} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">住所 <span className="text-red-500">*</span></label>
              <input required value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} className="w-full p-3 border rounded-xl" placeholder="例：北海道札幌市中央区..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">ご確認のご連絡方法</label>
              <div className="flex flex-wrap gap-3">
                {["お電話", "メール", "LINE"].map(method => (
                  <label key={method} className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-all ${customer.contactMethod === method ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="contactMethod"
                      value={method}
                      checked={customer.contactMethod === method}
                      onChange={e => setCustomer({ ...customer, contactMethod: e.target.value })}
                      className="hidden"
                    />
                    {method}
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 font-bold mt-2">後程担当者よりご連絡いたします。</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">備考・ご要望</label>
              <textarea value={customer.notes} onChange={e => setCustomer({ ...customer, notes: e.target.value })} rows={3} className="w-full p-3 border rounded-xl" placeholder="ご要望やご質問があればご記入ください" />
            </div>

            {message.text && (
              <div className={`p-4 rounded-xl text-center font-bold ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={loading || !selectedDate} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-300 transition-all text-xl mb-2">
              {loading ? "送信中..." : "この内容で仮予約・お問い合わせする"}
            </button>
            <p className="text-center text-[10px] text-slate-400">※送信後、担当者より確認のご連絡をいたします。この時点では予約は確定しません。</p>
          </form>
        </section>
      </div>
    </div>
  );
}
