// @/src/hooks/useBooking.ts
import { useState, useMemo } from "react";

// --- 予約専用の4階層 型定義 ---
export type BookingOption = { id: string; title: string; price: number; durationMin: number; subMenuId: string };
export type BookingSubMenu = { id: string; title: string; price: number; durationMin: number; menuId: string; options: BookingOption[] };
export type BookingMenu = { id: string; title: string; basePrice: number; priceNote: string | null; basicItems: string | null; notes: string | null; durationMin: number; categoryId: string; subMenus: BookingSubMenu[] };
export type BookingCategory = { id: string; title: string; menus: BookingMenu[] };

export function useBooking() {
  const [categories, setCategories] = useState<BookingCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BookingCategory | null>(null);
  
  // 選択状態の管理（IDの配列で管理）
  const[selectedMenus, setSelectedMenus] = useState<string[]>([]);
  const [selectedSubMenus, setSelectedSubMenus] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // --- 合計金額と時間の計算 ---
  const totals = useMemo(() => {
    let subTotal = 0;
    let totalMinutes = 0;
    const summaryItems: { title: string; price: number; type: "menu" | "submenu" | "option" }[] =[];

    if (selectedCategory) {
      selectedCategory.menus.forEach(menu => {
        if (selectedMenus.includes(menu.id)) {
          subTotal += menu.basePrice;
          totalMinutes += menu.durationMin;
          summaryItems.push({ title: menu.title, price: menu.basePrice, type: "menu" });

          menu.subMenus.forEach(subMenu => {
            if (selectedSubMenus.includes(subMenu.id)) {
              subTotal += subMenu.price;
              totalMinutes += subMenu.durationMin;
              summaryItems.push({ title: `└ ${subMenu.title}`, price: subMenu.price, type: "submenu" });

              subMenu.options.forEach(opt => {
                if (selectedOptions.includes(opt.id)) {
                  subTotal += opt.price;
                  totalMinutes += opt.durationMin;
                  summaryItems.push({ title: `　└ ${opt.title}`, price: opt.price, type: "option" });
                }
              });
            }
          });
        }
      });
    }

    // 割引計算（例: 水回りカテゴリで中分類(menu)が2つ以上選択されたら10%OFF）
    let discount = 0;
    if (selectedCategory?.title.includes("水回り") && selectedMenus.length >= 2) {
      discount = Math.floor(subTotal * 0.1);
    }

    return {
      subTotal,
      discount,
      totalPrice: subTotal - discount,
      totalMinutes,
      summaryItems // サマリー表示用データ
    };
  },[selectedCategory, selectedMenus, selectedSubMenus, selectedOptions]);

  // --- 選択ハンドラ ---
  const toggleMenu = (menuId: string) => {
    setSelectedMenus(prev => {
      if (prev.includes(menuId)) {
        // 親（中分類）を外す時、子（小・極小）も全て外す
        const menu = selectedCategory?.menus.find(m => m.id === menuId);
        if (menu) {
          const subMenuIds = menu.subMenus.map(s => s.id);
          const optionIds = menu.subMenus.flatMap(s => s.options.map(o => o.id));
          setSelectedSubMenus(subs => subs.filter(id => !subMenuIds.includes(id)));
          setSelectedOptions(opts => opts.filter(id => !optionIds.includes(id)));
        }
        return prev.filter(id => id !== menuId);
      }
      return[...prev, menuId];
    });
  };

  const toggleSubMenu = (subMenuId: string, menuId: string) => {
    if (!selectedMenus.includes(menuId)) return; // 親が未選択なら無視

    setSelectedSubMenus(prev => {
      if (prev.includes(subMenuId)) {
        // 子（小分類）を外す時、孫（極小）も全て外す
        const subMenu = selectedCategory?.menus.find(m => m.id === menuId)?.subMenus.find(s => s.id === subMenuId);
        if (subMenu) {
          const optionIds = subMenu.options.map(o => o.id);
          setSelectedOptions(opts => opts.filter(id => !optionIds.includes(id)));
        }
        return prev.filter(id => id !== subMenuId);
      }
      return [...prev, subMenuId];
    });
  };

  const toggleOption = (optionId: string, subMenuId: string) => {
    if (!selectedSubMenus.includes(subMenuId)) return; // 親が未選択なら無視
    setSelectedOptions(prev => prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]);
  };

  return {
    categories, setCategories,
    selectedCategory, setSelectedCategory,
    selectedMenus, setSelectedMenus,
    selectedSubMenus, setSelectedSubMenus,
    selectedOptions, setSelectedOptions,
    totals, toggleMenu, toggleSubMenu, toggleOption
  };
}