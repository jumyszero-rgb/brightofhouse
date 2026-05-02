// @/src/components/booking/BookingIntegrated.tsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import BookingCalendar from "@/components/BookingCalendar";
import { useBooking, BookingCategory, BookingMenu, BookingSubMenu, BookingOption } from "@/hooks/useBooking";

type Props = {
  initialCategoryId?: string;
  initialMenuId?: string; 
};

const getStyleClass = (color: string, size: string, align: string) => {
  let classes = "";
  if (color === "red") classes += "text-red-600 ";
  else if (color === "blue") classes += "text-blue-600 ";
  else classes += "text-slate-700 ";
  
  if (size === "xs") classes += "text-xs ";
  else if (size === "sm") classes += "text-sm ";
  else if (size === "lg") classes += "text-lg font-bold ";
  else if (size === "xl") classes += "text-xl font-bold ";
  else classes += "text-base ";
  
  if (align === "center") classes += "text-center ";
  else if (align === "right") classes += "text-right ";
  else classes += "text-left ";
  
  return classes;
};

export default function BookingIntegrated({ initialCategoryId, initialMenuId }: Props) {
  const {
    categories, setCategories,
    selectedCategory, setSelectedCategory,
    selectedMenus, setSelectedMenus,
    selectedSubMenus, setSelectedSubMenus,
    selectedOptions, setSelectedOptions,
    totals, toggleMenu, toggleSubMenu, toggleOption
  } = useBooking();

  const[selectedTime, setSelectedTime] = useState<Date | null>(null);
  const[isSubmitting, setIsSubmitting] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]); 

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/booking-master"); 
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        
        if (initialCategoryId) {
          const cat = data.find((c: BookingCategory) => c.id === initialCategoryId);
          if (cat) {
            setSelectedCategory(cat);
            if (initialMenuId) {
              setSelectedMenus([initialMenuId]);
              setExpandedMenus([initialMenuId]);
            }
          }
        }
      }
    };
    fetchData();
  }, [initialCategoryId, initialMenuId, setCategories, setSelectedCategory, setSelectedMenus]);

  const toggleAccordion = (id: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') return;
    setExpandedMenus(prev => prev.includes(id) ? prev.filter(i => i !== id) :[...prev, id]);
  };

  const handleBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTime) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const itemsText = totals.summaryItems.map(i => i.title).join("\n");

    const bookingData = {
      category: selectedCategory?.title,
      items: itemsText,
      name: formData.get("name"),
      email: formData.get("email"),
      tel: formData.get("tel"),
      startTime: selectedTime.toISOString(),
      endTime: new Date(selectedTime.getTime() + totals.totalMinutes * 60000).toISOString(),
      totalPrice: totals.totalPrice,
      totalMinutes: totals.totalMinutes,
    };

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      if (res.ok) {
        alert("仮予約を承りました。担当者より折り返しご連絡いたします。");
        window.location.href = "/";
      }
    } catch (e) { 
      alert("送信エラーが発生しました。"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-black text-left">
      <div className="lg:col-span-2 space-y-8">

                {/* LINE案内 */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
          <img src="/images/line-qr.JPG" alt="LINE QRコード" className="w-20 h-20 rounded-lg border" />
          <div>
            <p className="font-bold text-green-700 text-sm">LINEでもお問い合わせ可能です</p>
            <p className="text-xs text-slate-600 mt-1">スマホでQRコードを読み取ってお気軽にご相談ください。</p>
          </div>
        </div>

        
        {/* --- Step 1: 大分類選択 --- */}
        {!initialCategoryId && (
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              プランカテゴリ
            </h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { 
                    setSelectedCategory(cat); 
                    setSelectedMenus([]); 
                    setSelectedSubMenus([]); 
                    setSelectedOptions([]); 
                    setSelectedTime(null); 
                    setExpandedMenus([]); 
                  }}
                  className={`px-5 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                    selectedCategory?.id === cat.id ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* --- Step 2: メニュー選択 --- */}
        {selectedCategory && (
          <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                {initialCategoryId ? "1" : "2"}
              </span>
              メニュー詳細とオプション
            </h2>
            <div className="space-y-4">
              {selectedCategory.menus.map((menu: BookingMenu) => {
                const isMenuChecked = selectedMenus.includes(menu.id);
                const isExpanded = expandedMenus.includes(menu.id);

                return (
                  <div key={menu.id} className={`border-2 rounded-2xl overflow-hidden transition-all ${isMenuChecked ? "border-blue-500 bg-blue-50/10 shadow-md" : "border-slate-200 bg-white hover:border-blue-300"}`}>
                    
                    <div className="flex items-start gap-4 p-5 cursor-pointer" onClick={(e) => toggleAccordion(menu.id, e)}>
                      <input 
                        type="checkbox" 
                        checked={isMenuChecked}
                        onChange={() => { toggleMenu(menu.id); if (!isMenuChecked && !isExpanded) setExpandedMenus(prev => [...prev, menu.id]); }}
                        className="mt-1.5 w-6 h-6 accent-blue-600 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-baseline gap-2">
                          <div>
                            <span className="font-bold text-slate-800 text-lg">{menu.title}</span>
                          </div>
                          <div className="text-left md:text-right flex items-baseline gap-2">
                            {menu.priceNote && <span className="text-xs font-bold text-red-600 border border-red-200 bg-red-50 px-2 py-0.5 rounded">{menu.priceNote}</span>}
                            <span className="font-black text-blue-700 text-2xl">{menu.basePrice.toLocaleString()}円</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">作業時間目安: {menu.durationMin}分</p>
                      </div>
                      <div className="mt-1.5 text-slate-400 flex-shrink-0">{isExpanded ? "▲" : "▼"}</div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-top-2 duration-200">
                        
                        {menu.basicItems && (
                          <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 border-l-4 border-slate-300 pl-2">基本作業内容</h4>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap bg-white p-4 rounded-xl border border-slate-100">{menu.basicItems}</p>
                          </div>
                        )}

                        {menu.subMenus && menu.subMenus.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 border-l-4 border-orange-300 pl-2">追加オプション</h4>
                            <div className="space-y-3">
                              {menu.subMenus.map((subMenu: BookingSubMenu) => {
                                const isSubChecked = selectedSubMenus.includes(subMenu.id);
                                return (
                                  <div key={subMenu.id} className={`bg-white rounded-xl border transition-all ${isSubChecked ? "border-orange-400 shadow-sm" : "border-slate-200"}`}>
                                    <button 
                                      type="button" 
                                      disabled={!isMenuChecked}
                                      onClick={(e) => { e.preventDefault(); if (isMenuChecked) toggleSubMenu(subMenu.id, menu.id); }}
                                      className={`w-full flex justify-between items-center p-3 text-left transition-colors ${!isMenuChecked ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={isSubChecked} readOnly className="w-4 h-4 accent-orange-500" />
                                        <span className="font-bold text-sm text-slate-800">{subMenu.title}</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-bold text-orange-600 text-sm">+{subMenu.price.toLocaleString()}円</span>
                                        <span className="text-[10px] text-slate-400 block">+{subMenu.durationMin}分</span>
                                      </div>
                                    </button>

                                    {isSubChecked && subMenu.options && subMenu.options.length > 0 && (
                                      <div className="px-4 pb-3 pt-1 border-t border-orange-100 bg-orange-50/30">
                                        <p className="text-[10px] font-bold text-orange-400 uppercase mb-2">さらに追加</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          {subMenu.options.map((opt: BookingOption) => {
                                            const isOptChecked = selectedOptions.includes(opt.id);
                                            return (
                                              <button
                                                key={opt.id}
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); toggleOption(opt.id, subMenu.id); }}
                                                className={`flex justify-between items-center p-2 rounded-lg border text-xs transition-all ${isOptChecked ? "bg-orange-500 text-white border-orange-500 font-bold" : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"}`}
                                              >
                                                <span>{opt.title}</span>
                                                <span>+{opt.price.toLocaleString()}円</span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {!isMenuChecked && <p className="text-[10px] text-orange-400 mt-2">※オプションを選択するには、親メニューにチェックを入れてください。</p>}
                          </div>
                        )}

                        {menu.notes && (
                          <div>
                            <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2 border-l-4 border-red-300 pl-2">注意事項</h4>
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{menu.notes}</p>
                            </div>
                          </div>
                        )}
                        
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* --- Step 3: カレンダー --- */}
        {selectedMenus.length > 0 && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                {initialCategoryId ? "2" : "3"}
              </span>
              空き状況から日時を選択
            </h2>
            <BookingCalendar category={selectedCategory?.title || ""} onSelectSlot={setSelectedTime} />
          </section>
        )}
      </div>

      {/* --- 右側：見積サマリーと個人情報入力 --- */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-6">
          
          {/* お見積り状況（インライン表示） */}
          <div className="bg-slate-800 rounded-3xl p-6 text-white shadow-xl border-t-4 border-blue-500">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><span className="text-blue-400">📋</span> お見積り状況</h3>
            <div className="space-y-3 text-sm">
              {totals.summaryItems.map((item, idx) => (
                <div key={idx} className={`flex justify-between ${item.type === "menu" ? "border-b border-white/10 pb-2 font-bold mt-2" : item.type === "submenu" ? "text-orange-200 pl-2" : "text-orange-300 text-xs pl-4"}`}>
                  <span>{item.title}</span>
                  <span className="font-mono">{item.price.toLocaleString()}円</span>
                </div>
              ))}
              {totals.summaryItems.length === 0 && <p className="text-slate-400 text-xs">サービスが選択されていません</p>}
              
              <div className="pt-4 border-t border-white/20 space-y-2">
                <div className="flex justify-between text-slate-400"><span>小計</span><span>{totals.subTotal.toLocaleString()}円</span></div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-yellow-400 font-bold"><span>セット割引(10%OFF)</span><span>-{totals.discount.toLocaleString()}円</span></div>
                )}
                <div className="flex justify-between text-slate-400 text-xs"><span>作業時間目安</span><span>約 {Math.floor(totals.totalMinutes / 60)}時間 {totals.totalMinutes % 60}分</span></div>
                <div className="pt-4 flex justify-between items-end text-yellow-400 border-t border-white/20">
                  <span className="font-bold text-white">合計金額(税込)</span>
                  <span className="text-3xl font-black">{totals.totalPrice.toLocaleString()}<span className="text-sm ml-1">円</span></span>
                </div>
              </div>
              
              {selectedTime && (
                <div className="mt-4 p-3 bg-blue-600/30 rounded-xl border border-blue-400/50 animate-pulse">
                  <p className="text-[10px] text-blue-200 uppercase font-bold">選択中の予約日時</p>
                  <p className="text-sm font-bold text-white">{format(selectedTime, "M月d日(E) HH:00 〜", { locale: ja })}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* お客様情報入力フォーム */}
          {selectedTime && (
            <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-blue-600 animate-in zoom-in-95 duration-300">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">お客様情報入力</h4>
              <form onSubmit={handleBooking} className="space-y-3">
                <input name="name" type="text" placeholder="お名前" required className="w-full p-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-black" />
                <input name="email" type="email" placeholder="メールアドレス" required className="w-full p-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-black" />
                <input name="tel" type="tel" placeholder="電話番号" required className="w-full p-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-black" />
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg hover:bg-blue-700 disabled:bg-slate-400 transition-all text-lg mt-4"
                >
                  {isSubmitting ? "送信中..." : "仮予約を申し込む"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}