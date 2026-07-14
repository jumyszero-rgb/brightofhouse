// @/src/components/booking/ServicePageBooking.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { format, addDays, startOfDay, eachHourOfInterval, setHours, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { roundAmount, type RoundingMode } from "@/lib/bookingMenuToBookingData";

type FoldItem = { id: string; title: string; price: number; originalPrice?: number; durationMin: number; durationMax: number; workContent?: string; comment?: string; cautionNote?: string };

type DiscountRule = { count: number; value: number };
type QtyDiscount = { enabled: boolean; rules: DiscountRule[]; rounding?: RoundingMode };

type OptionItem = {
  id: string; title: string; price: number; originalPrice?: number; durationMin: number; durationMax: number;
  maxQty: number; workContent?: string; comment?: string; parentFoldItemId?: string; qtyDiscount?: QtyDiscount;
};

type SetDiscount = { enabled: boolean; type: "amount" | "percent"; rules: DiscountRule[]; rounding?: RoundingMode };

// 割引率表示のラベル。端数処理(切り上げ/切り捨て)が有効な場合、実際の値引率とズレるため「約」を付ける。
const discountLabel = (value: number, rounding?: RoundingMode) => `${rounding && rounding !== "NONE" ? "約" : ""}${value}%`;

type MainService = {
  id?: string; title: string; price: number; originalPrice?: number; durationMin: number; durationMax: number;
  workContent?: string; comment?: string; cautionNote?: string;
  foldTitle?: string; foldItems?: FoldItem[];
  options?: OptionItem[];
  setDiscount?: SetDiscount;
  // trueの場合、foldTitleがあってもmain自体(基本料金)を単独で選択できるチェックボックスを表示する。
  // 予約マスターの小分類は基本料金への「追加項目」であり、代替の選択肢ではないため。
  hasBaseSelection?: boolean;
  // 大分類(BookingCategory)からリンクされた複数メニューをまたぐ「まとめ割引」用。
  // 同じ groupId を持つ main 同士で選択数をカウントし、setDiscount とは別に合計から値引きする。
  groupId?: string;
  groupTitle?: string;
  groupSetDiscount?: SetDiscount;
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

  const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({});
  const [selectedMains, setSelectedMains] = useState<number[]>([0]);
  const [selectedFoldItemIds, setSelectedFoldItemIds] = useState<string[]>([]);
  const [openFolds, setOpenFolds] = useState<Record<string, boolean>>({});
  const toggleFold = (id: string) => setOpenFolds(prev => ({ ...prev, [id]: !prev[id] }));
  // 大分類(グループ)のチェックボックス開閉。中身の中分類一覧はチェックしたときだけ表示する。
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (id: string) => setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bookedSlots, setBookedSlots] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  // 作業内容が未定でお問い合わせのみ行いたい場合（チェックした段階でメニュー・カレンダーを両方非表示にする）
  const [inquiryOnly, setInquiryOnly] = useState(false);
  // 日程が未定の場合（お問い合わせのみではない・カレンダーは非表示にし選択不要にする）
  const [dateUndecided, setDateUndecided] = useState(false);
  // 見積を希望するか（駐車場確認の前に置くチェックボックス）
  const [wantEstimate, setWantEstimate] = useState(false);

  const [customer, setCustomer] = useState({
    name: "", email: "", phone: "", zip: "", address: "", notes: "", contactMethods: ["お電話"] as string[],
    parkingAvailable: "" as string,
    waterOk: "" as string, electricityOk: "" as string, gasOk: "" as string,
    paymentMethod: "" as string
  });
  const toggleContactMethod = (method: string) => {
    setCustomer(prev => {
      // 最低1つは選択必須のため、残り1つの状態からは外せないようにする
      if (prev.contactMethods.includes(method) && prev.contactMethods.length === 1) return prev;
      return {
        ...prev,
        contactMethods: prev.contactMethods.includes(method)
          ? prev.contactMethods.filter(m => m !== method)
          : [...prev.contactMethods, method],
      };
    });
  };

  const [nightWork, setNightWork] = useState(false);
  const [calendarStartHour, setCalendarStartHour] = useState(5);
  const [calendarEndHour, setCalendarEndHour] = useState(22);
  const [openCautions, setOpenCautions] = useState<Record<string, boolean>>({});
  const toggleCaution = (id: string) => setOpenCautions(prev => ({ ...prev, [id]: !prev[id] }));

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

  // main自体(基本料金)を単独で選択できるか（折り畳みが無いか、小分類が「追加項目」の場合）
  const hasBaseSelection = (main: MainService): boolean => !main.foldTitle || !!main.hasBaseSelection;

  // 折り畳み内の項目(小分類)が計算対象として有効か。
  // 予約マスター由来(hasBaseSelection)の場合は中分類自体がチェックされている時のみ有効。
  // 手入力の折り畳みグループ(中分類の概念が無い)は常に有効（従来通り）。
  const isFoldActive = (main: MainService, idx: number): boolean =>
    !main.hasBaseSelection || selectedMains.includes(idx);

  // セット値引き計算（中分類内での小分類選択個数に応じた値引き）
  const calcSetDiscount = (main: MainService, idx: number): number => {
    if (!main.setDiscount?.enabled || !main.foldItems || !isFoldActive(main, idx)) return 0;
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
      const rawFinal = subtotal - (subtotal * matchedRule.value / 100);
      return subtotal - roundAmount(rawFinal, main.setDiscount.rounding);
    }
  };

  const totalSetDiscount = mains.reduce((sum, m, idx) => sum + calcSetDiscount(m, idx), 0);

  // ある main が「選択されている」か
  // (予約マスター由来: 中分類自体のチェック / 手入力の折り畳み: 中の項目が1つでも選択済み)
  const isMainSelected = (main: MainService, idx: number): boolean =>
    hasBaseSelection(main)
      ? selectedMains.includes(idx)
      : !!(main.foldTitle && (main.foldItems || []).some(fi => selectedFoldItemIds.includes(fi.id)));

  // 選択されている main の小計（予約マスター由来: 基本料金 + 選択中の小分類 / 手入力: 選択中の代替項目のみ）
  const mainSelectedSubtotal = (main: MainService, idx: number): number => {
    if (hasBaseSelection(main)) {
      if (!selectedMains.includes(idx)) return 0;
      return (main.price || 0) + (main.foldItems || []).filter(fi => selectedFoldItemIds.includes(fi.id)).reduce((sum, fi) => sum + (fi.price || 0), 0);
    }
    return (main.foldItems || []).filter(fi => selectedFoldItemIds.includes(fi.id)).reduce((sum, fi) => sum + (fi.price || 0), 0);
  };

  // まとめ割引計算（大分類経由でリンクされた複数メニューを横断した段階値引き。setDiscountとは別枠）
  const mainsWithIndex = mains.map((m, idx) => ({ m, idx }));
  const groupIds = Array.from(new Set(mains.filter(m => m.groupId).map(m => m.groupId!)));
  const calcGroupDiscount = (groupId: string): number => {
    const groupMains = mainsWithIndex.filter(({ m }) => m.groupId === groupId);
    const groupDiscount = groupMains[0]?.m.groupSetDiscount;
    if (!groupDiscount?.enabled) return 0;
    const selected = groupMains.filter(({ m, idx }) => isMainSelected(m, idx));
    if (selected.length < 2) return 0;

    const rules = [...(groupDiscount.rules || [])].sort((a, b) => b.count - a.count);
    const matchedRule = rules.find(r => selected.length >= r.count);
    if (!matchedRule) return 0;

    if (groupDiscount.type === "amount") return matchedRule.value;
    const subtotal = selected.reduce((sum, { m, idx }) => sum + mainSelectedSubtotal(m, idx), 0);
    const rawFinal = subtotal - (subtotal * matchedRule.value / 100);
    return subtotal - roundAmount(rawFinal, groupDiscount.rounding);
  };
  const totalGroupDiscount = groupIds.reduce((sum, id) => sum + calcGroupDiscount(id), 0);

  // 個数値引き計算（オプション自身の選択数に応じた段階値引き。%のみ）
  const calcOptionQtyDiscount = (opt: OptionItem, qty: number): number => {
    if (!opt.qtyDiscount?.enabled || qty < 2) return 0;
    const rules = [...(opt.qtyDiscount.rules || [])].sort((a, b) => b.count - a.count);
    const matchedRule = rules.find(r => qty >= r.count);
    if (!matchedRule) return 0;
    const subtotal = opt.price * qty;
    const rawFinal = subtotal - (subtotal * matchedRule.value / 100);
    return subtotal - roundAmount(rawFinal, opt.qtyDiscount.rounding);
  };

  const totalQtyDiscount = mains.flatMap(m => (m.options || [])).reduce((sum, o) => sum + calcOptionQtyDiscount(o, getQty(o.id)), 0);

  // オプション(追加オプション)が計算対象として有効か（親の中分類が有効 かつ 紐づく小分類が選択済み）
  const isOptionActive = (main: MainService, idx: number, opt: OptionItem): boolean =>
    isFoldActive(main, idx) && (!opt.parentFoldItemId || selectedFoldItemIds.includes(opt.parentFoldItemId));

  // 合計計算
  const mainNoFoldPrice = mains.filter((m, idx) => hasBaseSelection(m) && selectedMains.includes(idx)).reduce((sum, m) => sum + (m.price || 0), 0);
  const mainFoldPrice = mains.reduce((sum, m, idx) => isFoldActive(m, idx) ? sum + (m.foldItems || []).filter(fi => selectedFoldItemIds.includes(fi.id)).reduce((s, fi) => s + (fi.price || 0), 0) : sum, 0);
  const mainOptionPrice = mains.reduce((sum, m, idx) => sum + (m.options || []).filter(o => getQty(o.id) > 0 && isOptionActive(m, idx, o)).reduce((s, o) => s + o.price * getQty(o.id), 0), 0);
  const legacyNoFoldPrice = legacyOptions.filter(o => !o.foldTitle).reduce((sum, o) => sum + o.price * getQty(o.id), 0);
  const legacyFoldPrice = legacyOptions.flatMap(o => (o.foldItems || []).filter(fi => getQty(fi.id) > 0)).reduce((sum, fi) => sum + fi.price * getQty(fi.id), 0);
  const totalPrice = mainNoFoldPrice + mainFoldPrice + mainOptionPrice + legacyNoFoldPrice + legacyFoldPrice - totalSetDiscount - totalQtyDiscount - totalGroupDiscount;
  // 合計時間計算
  const mainNoFoldMinMin = mains.filter((m, idx) => hasBaseSelection(m) && selectedMains.includes(idx)).reduce((sum, m) => sum + (m.durationMin || 0), 0);
  const mainFoldMinMin = mains.reduce((sum, m, idx) => isFoldActive(m, idx) ? sum + (m.foldItems || []).filter(fi => selectedFoldItemIds.includes(fi.id)).reduce((s, fi) => s + (fi.durationMin || 0), 0) : sum, 0);
  const mainOptionMinMin = mains.reduce((sum, m, idx) => sum + (m.options || []).filter(o => getQty(o.id) > 0 && isOptionActive(m, idx, o)).reduce((s, o) => s + o.durationMin * getQty(o.id), 0), 0);
  const legacyNoFoldMinMin = legacyOptions.filter(o => !o.foldTitle).reduce((sum, o) => sum + o.durationMin * getQty(o.id), 0);
  const legacyFoldMinMin = legacyOptions.flatMap(o => (o.foldItems || []).filter(fi => getQty(fi.id) > 0)).reduce((sum, fi) => sum + fi.durationMin * getQty(fi.id), 0);
  const totalMinutesMin = mainNoFoldMinMin + mainFoldMinMin + mainOptionMinMin + legacyNoFoldMinMin + legacyFoldMinMin;

  const mainNoFoldMinMax = mains.filter((m, idx) => hasBaseSelection(m) && selectedMains.includes(idx)).reduce((sum, m) => sum + (m.durationMax || 0), 0);
  const mainFoldMinMax = mains.reduce((sum, m, idx) => isFoldActive(m, idx) ? sum + (m.foldItems || []).filter(fi => selectedFoldItemIds.includes(fi.id)).reduce((s, fi) => s + (fi.durationMax || 0), 0) : sum, 0);
  const mainOptionMinMax = mains.reduce((sum, m, idx) => sum + (m.options || []).filter(o => getQty(o.id) > 0 && isOptionActive(m, idx, o)).reduce((s, o) => s + o.durationMax * getQty(o.id), 0), 0);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inquiryOnly && !selectedDate && !dateUndecided) return alert("日時を選択するか、「日程未定」にチェックしてください");

    // お問い合わせのみの場合、メニュー選択欄自体を非表示にしているため、
    // 初期選択されたままのmains[0]等が意図せず混入しないようにする
    const itemsTextRaw = inquiryOnly ? "" : [
      ...mains.filter((m, idx) => hasBaseSelection(m) && selectedMains.includes(idx)).map(m => m.title),
      ...mains.flatMap((m, idx) => isFoldActive(m, idx) ? (m.foldItems || []).filter(fi => selectedFoldItemIds.includes(fi.id)).map(fi => fi.title) : []),
      ...mains.flatMap((m, idx) => (m.options || []).filter(o => getQty(o.id) > 0 && isOptionActive(m, idx, o)).map(o => `${o.title} ×${getQty(o.id)}`)),
      ...legacyOptions.filter(o => !o.foldTitle && getQty(o.id) > 0).map(o => `${o.title} ×${getQty(o.id)}`),
      ...legacyOptions.flatMap(o => (o.foldItems || []).filter(fi => getQty(fi.id) > 0).map(fi => `${fi.title} ×${getQty(fi.id)}`))
    ].join(", ");

    if (!itemsTextRaw && !inquiryOnly) {
      alert("作業メニューを1つ以上選択してください。");
      return;
    }
    const itemsText = itemsTextRaw || "（作業内容未定・お問い合わせのみ）";
    if (customer.contactMethods.length === 0) {
      alert("ご連絡方法を選択してください。");
      return;
    }

    const discountNotes = mains.map((m, idx) => {
      const disc = calcSetDiscount(m, idx);
      if (disc > 0) {
        const count = (m.foldItems || []).filter(fi => selectedFoldItemIds.includes(fi.id)).length;
        return `【${m.foldTitle || m.title} ${count}点セット値引き: -¥${disc.toLocaleString()}】`;
      }
      return "";
    }).filter(Boolean).join("\n");

    setLoading(true);

    // 日程未定の場合、DB上のstartTime/endTimeは必須項目のため申込時刻を仮値として保存し、
    // 備考欄に明示することで担当者が「確定枠ではない」と分かるようにする。
    const effectiveStart = selectedDate || new Date();
    const effectiveEnd = selectedDate
      ? new Date(selectedDate.getTime() + totalMinutesMax * 60000)
      : new Date(effectiveStart.getTime() + Math.max(totalMinutesMax, 60) * 60000);

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
          contactMethod: customer.contactMethods.join("、"),
          notes: [
            wantEstimate ? "【見積希望】" : "",
            inquiryOnly ? "【お問い合わせのみ・日程未定】" : dateUndecided ? "【日程未定・後日調整希望】" : "",
            !inquiryOnly && customer.parkingAvailable ? `【駐車場：${customer.parkingAvailable}】` : "",
            !inquiryOnly && customer.waterOk ? `【水道：${customer.waterOk}】` : "",
            !inquiryOnly && customer.electricityOk ? `【電気：${customer.electricityOk}】` : "",
            !inquiryOnly && customer.gasOk ? `【ガス：${customer.gasOk}】` : "",
            customer.paymentMethod ? `【希望お支払方法：${customer.paymentMethod}】` : "",
            nightWork ? "【深夜帯作業希望】" : "",
            discountNotes,
            customer.notes,
          ].filter(Boolean).join("\n"),
          startTime: format(effectiveStart, "yyyy-MM-dd'T'HH:mm:ss"),
          endTime: format(effectiveEnd, "yyyy-MM-dd'T'HH:mm:ss"),
          items: itemsText,
          totalPrice: inquiryOnly ? 0 : totalPrice,
          totalMinutes: inquiryOnly ? "未定" : `${totalMinutesMin}〜${totalMinutesMax}`,
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

  // 追加オプション1件分の描画。小分類にネストされる場合・中分類直下の場合の両方で共用する。
  const renderOptionRow = (opt: OptionItem) => {
    const qty = getQty(opt.id);
    const qtyDiscountAmount = calcOptionQtyDiscount(opt, qty);
    return (
      <div key={opt.id}>
        <div className={`p-2 rounded-lg border transition-all ${qty > 0 ? 'bg-indigo-50 border-indigo-400' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-0 mb-1">
            <div>
              <span className="text-xs font-medium">{opt.title}</span>
              {(opt.durationMin > 0 || opt.durationMax > 0) && (
                <span className="text-[10px] text-slate-400 ml-1">
                  (+{opt.durationMin === opt.durationMax ? `${opt.durationMin}分` : `${opt.durationMin}〜${opt.durationMax}分`})
                </span>
              )}
            </div>
            {opt.price > 0 && (
              <span className="text-xs">
                {opt.originalPrice != null && (
                  <span className="text-slate-400 line-through mr-1">+¥{opt.originalPrice.toLocaleString()}</span>
                )}
                <span className="font-bold text-slate-600">+¥{opt.price.toLocaleString()}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => setQty(opt.id, Math.max(0, qty - 1))} className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center hover:bg-slate-300">−</button>
            <span className="w-5 text-center font-bold text-xs">{qty}</span>
            <button type="button" onClick={() => setQty(opt.id, Math.min(opt.maxQty || Infinity, qty + 1))} disabled={qty >= (opt.maxQty || Infinity)} className="w-6 h-6 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400">+</button>
            {(opt.maxQty || 0) > 1 && <span className="text-[10px] text-slate-400">最大{opt.maxQty}</span>}
            {qtyDiscountAmount > 0 && (
              <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">-¥{qtyDiscountAmount.toLocaleString()}</span>
            )}
          </div>
          {opt.qtyDiscount?.enabled && opt.qtyDiscount.rules.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {[...opt.qtyDiscount.rules].sort((a, b) => a.count - b.count).map(rule => (
                <span key={rule.count} className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${qty >= rule.count ? 'bg-red-600 text-white' : 'bg-white text-red-600 border border-red-200'}`}>
                  {rule.count}個以上で{discountLabel(rule.value, opt.qtyDiscount?.rounding)}引き
                </span>
              ))}
            </div>
          )}
        </div>
        {opt.comment && <p className="text-[10px] text-slate-500 ml-2 mt-0.5">💬 {opt.comment}</p>}
        {opt.workContent && (
          <ul className="text-[10px] text-slate-500 ml-2 mt-0.5 space-y-0.5 list-disc list-outside pl-4">
            {opt.workContent.split("\n").filter(Boolean).map((line, i) => (
              <li key={i} className={line.startsWith("※") ? "list-none" : undefined}>{line}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  // 中分類(main)直下のオプション（小分類を経由しないもの）の描画。main自身のチェック時のみ表示する。
  const renderDirectOptions = (main: MainService) => {
    const directOptions = (main.options || []).filter(o => !o.parentFoldItemId);
    if (directOptions.length === 0) return null;
    return (
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-indigo-600">┗ オプション</p>
        {directOptions.map(opt => renderOptionRow(opt))}
      </div>
    );
  };

  // 小分類(foldItem)一覧の描画。中分類チェックで展開される場合・手入力の折り畳みグループの
  // どちらからも共用する。各小分類はさらに紐づく追加オプションをネストして表示する。
  const renderFoldItemsList = (main: MainService) => (
    <>
      {(main.foldItems || []).map(fi => {
        const checked = selectedFoldItemIds.includes(fi.id);
        const fiOptions = (main.options || []).filter(o => o.parentFoldItemId === fi.id);
        return (
          <div key={fi.id}>
            <label className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0 p-3 rounded-lg border cursor-pointer transition-all ${checked ? 'bg-blue-50 border-blue-400' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={checked} onChange={() => toggleFoldItem(fi.id)} className="w-4 h-4 accent-blue-600" />
                <div>
                  <span className="font-bold text-sm">{fi.title}</span>
                  {(fi.durationMin > 0 || fi.durationMax > 0) && (
                    <span className="text-xs text-slate-500 ml-2">
                      ({fi.durationMin === fi.durationMax ? `${fi.durationMin}分` : `${fi.durationMin}〜${fi.durationMax}分`})
                    </span>
                  )}
                </div>
              </div>
              {fi.price > 0 && (
                <span className="text-sm pl-7 sm:pl-0">
                  {fi.originalPrice != null && (
                    <span className="text-slate-400 line-through mr-1">¥{fi.originalPrice.toLocaleString()}</span>
                  )}
                  <span className="font-bold text-blue-600">¥{fi.price.toLocaleString()}</span>
                </span>
              )}
            </label>
            {fi.comment && <p className="text-xs text-slate-500 ml-8 mt-1">💬 {fi.comment}</p>}
            {fi.workContent && (
              <ul className="text-xs text-slate-600 ml-8 mt-1 space-y-0.5 list-disc list-outside pl-4">
                {fi.workContent.split("\n").filter(Boolean).map((line, i) => (
                  <li key={i} className={line.startsWith("※") ? "list-none" : undefined}>{line}</li>
                ))}
              </ul>
            )}

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

            {/* このfoldItem(小分類)に紐づく追加オプション（チェック時のみ表示） */}
            {checked && fiOptions.length > 0 && (
              <div className="ml-8 mt-2 mb-2 pl-3 border-l-4 border-indigo-200 space-y-1">
                <p className="text-[10px] font-bold text-indigo-600">┗ オプション</p>
                {fiOptions.map(opt => renderOptionRow(opt))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );

  // 中分類(main)のおすすめ・作業内容・注意事項の描画。3種のrenderMain分岐すべてから共用する。
  // チェック済み(選択中)の場合のみ呼び出す想定 — タイトル行とは別の余白を確保したブロックとして表示する。
  const renderMainDetails = (main: MainService, key: string) => {
    if (!main.comment && !main.workContent && !main.cautionNote) return null;
    return (
      <div className="space-y-1">
        {main.comment && <p className="text-xs text-slate-500">💬 {main.comment}</p>}
        {main.workContent && (
          <ul className="text-xs text-slate-600 space-y-0.5 list-disc list-outside pl-4">
            {main.workContent.split("\n").filter(Boolean).map((line, i) => (
              <li key={i} className={line.startsWith("※") ? "list-none" : undefined}>{line}</li>
            ))}
          </ul>
        )}
        {main.cautionNote && (
          <div>
            <button type="button" onClick={() => toggleCaution(key)} className="text-[10px] font-bold text-red-600 hover:underline">
              {openCautions[key] ? "▲ 注意事項を閉じる" : "⚠️ 注意事項を確認"}
            </button>
            {openCautions[key] && (
              <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 whitespace-pre-wrap">
                {main.cautionNote}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // 中分類1件分の描画。
  // ・予約マスター由来で小分類を持つ場合：中分類自体のチェックボックスを表示し、
  //   チェックすると小分類一覧が下に展開される（中分類の選択が消えないようにする）。
  // ・手入力(BookingDataEditor)の折り畳みグループ：中分類という概念が無いため従来通りのアコーディオン。
  // ・折り畳みが無い単純な項目：通常のチェックボックス。
  const renderMain = (main: MainService, idx: number) => {
    const hasFoldItems = !!main.foldItems && main.foldItems.length > 0;
    const hasDirectOptions = !!main.options && main.options.some(o => !o.parentFoldItemId);
    if (main.hasBaseSelection && (hasFoldItems || hasDirectOptions)) {
      const checked = selectedMains.includes(idx);
      const selectedInThisMain = (main.foldItems || []).filter(fi => selectedFoldItemIds.includes(fi.id));
      const discount = calcSetDiscount(main, idx);
      return (
        <div key={main.id || `main-${idx}`} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <label className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-4 cursor-pointer transition-all ${checked ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600"
                checked={checked}
                onChange={(e) => {
                  if (e.target.checked) setSelectedMains([...selectedMains, idx]);
                  else setSelectedMains(selectedMains.filter(i => i !== idx));
                }}
              />
              <div>
                <span className="font-bold">{main.title}</span>
                {(main.durationMin > 0 || main.durationMax > 0) && (
                  <span className="text-xs text-slate-500 ml-2">
                    ({main.durationMin === main.durationMax ? `${main.durationMin}分` : `${main.durationMin}〜${main.durationMax}分`})
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pl-7 sm:pl-0">
              {checked && selectedInThisMain.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">+{selectedInThisMain.length}件追加</span>
              )}
              {main.price > 0 && (
                <span>
                  {main.originalPrice != null && (
                    <span className="text-slate-400 line-through mr-1">¥{main.originalPrice.toLocaleString()}</span>
                  )}
                  <span className="font-bold text-blue-600">¥{main.price.toLocaleString()}</span>
                </span>
              )}
            </div>
          </label>
          {checked && (
            <div className="p-4 pt-3 pl-10 space-y-2 border-t border-slate-100">
              {renderMainDetails(main, main.id || `main-${idx}`)}
              <p className="text-[10px] font-bold text-slate-400">▼ 追加できる項目</p>
              {/* セット値引き案内（この中分類内での小分類選択個数に応じた値引き） */}
              {main.setDiscount?.enabled && main.setDiscount.rules.length > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3 mb-2">
                  <p className="text-xs font-bold text-red-700 mb-1">🎉 セット値引き</p>
                  <div className="flex flex-wrap gap-2">
                    {main.setDiscount.rules.sort((a, b) => a.count - b.count).map(rule => (
                      <span key={rule.count} className={`text-[10px] px-2 py-1 rounded-full font-bold ${selectedInThisMain.length >= rule.count ? 'bg-red-600 text-white' : 'bg-white text-red-600 border border-red-300'}`}>
                        {rule.count}点で{main.setDiscount!.type === "amount" ? `¥${rule.value.toLocaleString()}引き` : `${discountLabel(rule.value, main.setDiscount!.rounding)}引き`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {hasFoldItems && renderFoldItemsList(main)}
              {renderDirectOptions(main)}

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

    // ===== 折り畳みあり（手入力の代替グループ。中分類の概念が無いため従来通りアコーディオン） =====
    if (main.foldTitle && main.foldItems && main.foldItems.length > 0) {
      const foldKey = main.id || `main-fold-${idx}`;
      const selectedInThisMain = main.foldItems.filter(fi => selectedFoldItemIds.includes(fi.id));
      const discount = calcSetDiscount(main, idx);
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
              {renderMainDetails(main, foldKey)}
              {/* セット値引き案内 */}
              {main.setDiscount?.enabled && main.setDiscount.rules.length > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3 mb-2">
                  <p className="text-xs font-bold text-red-700 mb-1">🎉 セット値引き</p>
                  <div className="flex flex-wrap gap-2">
                    {main.setDiscount.rules.sort((a, b) => a.count - b.count).map(rule => (
                      <span key={rule.count} className={`text-[10px] px-2 py-1 rounded-full font-bold ${selectedInThisMain.length >= rule.count ? 'bg-red-600 text-white' : 'bg-white text-red-600 border border-red-300'}`}>
                        {rule.count}点で{main.setDiscount!.type === "amount" ? `¥${rule.value.toLocaleString()}引き` : `${discountLabel(rule.value, main.setDiscount!.rounding)}引き`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {renderFoldItemsList(main)}

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
    const flatKey = main.id || `main-${idx}`;
    return (
      <div key={flatKey}>
        <label className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0 p-4 rounded-xl border cursor-pointer transition-all ${selectedMains.includes(idx) ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
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
              {(main.durationMin > 0 || main.durationMax > 0) && (
                <span className="text-xs text-slate-500 ml-2">
                  ({main.durationMin === main.durationMax ? `${main.durationMin}分` : `${main.durationMin}〜${main.durationMax}分`})
                </span>
              )}
            </div>
          </div>
          {main.price > 0 && (
            <span className="pl-7 sm:pl-0">
              {main.originalPrice != null && (
                <span className="text-slate-400 line-through mr-1">¥{main.originalPrice.toLocaleString()}</span>
              )}
              <span className="font-bold text-blue-600">¥{main.price.toLocaleString()}</span>
            </span>
          )}
        </label>
        {selectedMains.includes(idx) && (
          <div className="ml-8 mr-4 mt-1 mb-2">
            {renderMainDetails(main, flatKey)}
          </div>
        )}
      </div>
    );
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

        {/* 作業内容が決まっていない場合はメニュー選択自体を不要にする */}
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={inquiryOnly}
              onChange={() => setInquiryOnly(!inquiryOnly)}
              className="w-4 h-4 accent-amber-600"
            />
            <span className="text-sm font-bold text-amber-700">作業内容はまだ決まっていない（お問い合わせのみ）</span>
          </label>
          {inquiryOnly && (
            <p className="text-xs text-amber-600 mt-2">作業メニューの選択は不要です。ご不明点やご相談だけでもお気軽にお問い合わせください。</p>
          )}
        </div>

        {/* 1. メニュー選択 */}
        {!inquiryOnly && (
        <section>
          <h4 className="flex items-center gap-2 font-bold text-lg mb-4 text-slate-800">
            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
            作業メニューの選択
          </h4>

          <div className="space-y-3">
            {(() => {
              const rendered: React.ReactNode[] = [];
              const handledGroupIds = new Set<string>();

              mains.forEach((main, idx) => {
                if (main.groupId) {
                  if (handledGroupIds.has(main.groupId)) return; // このグループは既に出力済み
                  handledGroupIds.add(main.groupId);
                  const groupId = main.groupId;
                  const groupMembers = mainsWithIndex.filter(({ m }) => m.groupId === groupId);
                  const discount = main.groupSetDiscount;
                  const selectedCount = groupMembers.filter(({ m, idx: i }) => isMainSelected(m, i)).length;
                  const savedAmount = calcGroupDiscount(groupId);

                  const groupOpen = !!openGroups[groupId];
                  rendered.push(
                    <div key={`group-${groupId}`} className="border-2 border-slate-200 rounded-xl p-3 bg-slate-50/60">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={groupOpen} onChange={() => toggleGroup(groupId)} className="w-4 h-4 accent-slate-600" />
                        <span className="text-xs font-bold text-slate-500">📂 {main.groupTitle}</span>
                        {selectedCount > 0 && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">選択中{selectedCount}件</span>
                        )}
                      </label>

                      {groupOpen && (
                        <div className="mt-3">
                          {/* まとめ割引の案内（大分類内の中分類を横断した選択個数による値引き） */}
                          {discount?.enabled && discount.rules?.length > 0 && (
                            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3 mb-3">
                              <p className="text-xs font-bold text-red-700 mb-1">
                                🎉 まとめ割引{selectedCount > 0 && `（現在${selectedCount}点選択中）`}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {[...discount.rules].sort((a, b) => a.count - b.count).map(rule => (
                                  <span key={rule.count} className={`text-[10px] px-2 py-1 rounded-full font-bold ${selectedCount >= rule.count ? 'bg-red-600 text-white' : 'bg-white text-red-600 border border-red-300'}`}>
                                    {rule.count}点で{discount.type === "amount" ? `¥${rule.value.toLocaleString()}引き` : `${discountLabel(rule.value, discount.rounding)}引き`}
                                  </span>
                                ))}
                              </div>
                              {savedAmount > 0 && (
                                <p className="text-sm font-bold text-red-600 mt-2">-¥{savedAmount.toLocaleString()} 適用中</p>
                              )}
                            </div>
                          )}

                          <div className="space-y-2 pl-2 border-l-2 border-slate-200">
                            {groupMembers.map(({ m, idx: i }) => renderMain(m, i))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  rendered.push(renderMain(main, idx));
                }
              });

              return rendered;
            })()}

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
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-0 mb-2">
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
                                      <button type="button" onClick={() => setQty(fi.id, Math.min(opt.maxQty || Infinity, qty + 1))} disabled={qty >= (opt.maxQty || Infinity)} className="w-7 h-7 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400">+</button>
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
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-0 mb-2">
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
                        <button type="button" onClick={() => setQty(opt.id, Math.min(opt.maxQty || Infinity, getQty(opt.id) + 1))} disabled={getQty(opt.id) >= (opt.maxQty || Infinity)} className="w-8 h-8 rounded-full bg-indigo-500 text-white font-bold text-lg flex items-center justify-center hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 transition-colors">+</button>
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
            {totalQtyDiscount > 0 && (
              <p className="text-sm text-red-600 font-bold">個数値引き：-¥{totalQtyDiscount.toLocaleString()}</p>
            )}
            {totalGroupDiscount > 0 && (
              <p className="text-sm text-red-600 font-bold">まとめ割引：-¥{totalGroupDiscount.toLocaleString()}</p>
            )}
            <p className="text-2xl font-black text-blue-600">合計：¥{totalPrice.toLocaleString()}<span className="text-sm ml-1 text-slate-500">(税込)</span></p>
            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed text-left sm:text-right">
              ※作業時間はワンオペのおおよその時間です。作業内容・状況により人員が追加になる場合があり、その場合は時間が短縮されることがあります。お申込み後、担当者よりおおよその目安をお伝えしますので、時間には余裕をもってお申込みください。
            </p>
          </div>
        </section>
        )}
        {/* 2. カレンダー選択 */}
        {!inquiryOnly && (
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

          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={dateUndecided}
              onChange={() => {
                setDateUndecided(!dateUndecided);
                if (!dateUndecided) setSelectedDate(null);
              }}
              className="w-4 h-4 accent-purple-600"
            />
            <span className="text-sm font-bold text-purple-700">日程未定（相談したい・カレンダー選択は不要）</span>
          </label>

          {!dateUndecided && (
          <>
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

                        // 現在時刻から2時間後まで×
                        const now = new Date();
                        const bufferTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                        const isWithinBuffer = current <= bufferTime && current >= now;

                        // 当日は12時（JST）より前を非表示扱い
                        const isToday = format(day, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
                        const isTodayBeforeNoon = isToday && hour < 12;

                        // オーバーライド判定（管理画面と同じISO比較）
                        const currentISO = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0).toISOString();
                        const override = overrides.find((o: any) => {
                          if (o.slotTime) {
                            return new Date(o.slotTime).toISOString() === currentISO;
                          }
                          if (o.date && o.hour !== undefined) {
                            return o.date === format(day, "yyyy-MM-dd") && o.hour === hour;
                          }
                          return false;
                        });
                        const manualStatus = override?.status;

                        const isUnavailable = isPast || isWithinBuffer || isTodayBeforeNoon || isBooked || manualStatus === "CLOSED";
                        const isConsult = !isUnavailable && manualStatus === "CONSULT";
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

                    {/* 当日予約の案内 */}
          <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs text-amber-700 text-center font-bold">
              ⚠️ 当日のお申し込みは12時以降の時間帯のみ表示しております。<br />
              作業時はお申し込みに気が付かない場合がございます。<br />
              お急ぎの場合はお電話にてお申し込みお願いいたします。
            </p>
            <p className="text-center mt-2">
              <a href="tel:0120-792-684" className="text-sm font-bold text-blue-700 underline">📞 0120-792-684（9:00〜18:00）</a>
            </p>
          </div>
          </>)}

          {/* 見積希望・駐車場・設備の確認（お問い合わせのみ以外は常に表示） */}
          <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={wantEstimate}
                onChange={() => setWantEstimate(!wantEstimate)}
                className="w-4 h-4 accent-purple-600"
              />
              <span className="text-sm font-bold text-purple-700">見積を希望する</span>
            </label>

            <div>
              <p className="text-xs font-bold text-slate-700 mb-1.5">作業車を停める駐車場はございますか？</p>
              <div className="flex gap-3">
                {["あり", "なし"].map(v => (
                  <label key={v} className={`px-4 py-1.5 rounded-full border cursor-pointer text-xs font-bold transition-all ${customer.parkingAvailable === v ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="parkingAvailable"
                      className="hidden"
                      checked={customer.parkingAvailable === v}
                      onChange={() => setCustomer({ ...customer, parkingAvailable: v })}
                    />
                    {v}
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">※駐車場がない場合は近隣のコインパーキングを利用させていただきます。その際のコインパーキング代は実費にてご請求いたします。</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">作業に必要な設備はご利用いただけますか？</p>
              {[
                { key: "waterOk" as const, label: "水道（必須）" },
                { key: "electricityOk" as const, label: "電気（必須）" },
                { key: "gasOk" as const, label: "ガス／お湯（任意・あると助かります）" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs text-slate-600">{label}</span>
                  <div className="flex gap-2">
                    {["OK", "NG"].map(v => (
                      <label key={v} className={`px-3 py-1 rounded-full border cursor-pointer text-xs font-bold transition-all ${customer[key] === v ? (v === "OK" ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-red-500 text-white border-red-500') : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                        <input
                          type="radio"
                          name={key}
                          className="hidden"
                          checked={customer[key] === v}
                          onChange={() => setCustomer({ ...customer, [key]: v })}
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

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
        )}

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
              <label className="block text-sm font-bold text-slate-700 mb-1">郵便番号 <span className="text-red-500">*</span></label>
              <input required value={customer.zip} onChange={e => handleZipSearch(e.target.value.replace(/[^0-9]/g, ""))} className="w-full p-3 border rounded-xl" placeholder="例：0600000（ハイフンなし7桁）" maxLength={7} />
              <p className="text-[10px] text-slate-400 mt-1">※郵便番号を入力すると住所が自動入力されます</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">住所</label>
              <input value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} className="w-full p-3 border rounded-xl" placeholder="例：北海道札幌市中央区..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">ご確認のご連絡方法（複数選択可）</label>
              <div className="flex flex-wrap gap-3">
                {["お電話", "メール", "LINE"].map(method => (
                  <label key={method} className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-all ${customer.contactMethods.includes(method) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                    <input
                      type="checkbox"
                      name="contactMethod"
                      value={method}
                      checked={customer.contactMethods.includes(method)}
                      onChange={() => toggleContactMethod(method)}
                      className="hidden"
                    />
                    {method}
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 font-bold mt-2">後程担当者よりご連絡いたします。</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">希望お支払方法</label>
              <div className="flex flex-wrap gap-3">
                {["現金", "クレカ", "QR"].map(method => (
                  <label key={method} className={`px-4 py-2 rounded-full border cursor-pointer transition-all ${customer.paymentMethod === method ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      className="hidden"
                      checked={customer.paymentMethod === method}
                      onChange={() => setCustomer({ ...customer, paymentMethod: method })}
                    />
                    {method}
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-2">※QRコード決済は上限がある場合がございます。当日QR決済ができない場合は、別のお支払い方法にてお支払いいただきます。</p>
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

            <button type="submit" disabled={loading || (!inquiryOnly && !selectedDate && !dateUndecided)} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-300 transition-all text-xl mb-2">
              {loading ? "送信中..." : "この内容で仮予約・お問い合わせする"}
            </button>
            <p className="text-center text-[10px] text-slate-400">※送信後、担当者より確認のご連絡をいたします。この時点では予約は確定しません。</p>
          </form>
        </section>
      </div>
    </div>
  );
}
