// @/src/components/SecurityNotice.tsx
// トップページ上部のお知らせ（2026年10月のPHP脆弱性について）。期間限定：2026-10-31 23:59（日本時間）まで表示し、以降は自動で出さない。
// 表示の判定はブラウザ側で行う（ページの作り置きに関係なく、期限が来たら確実に消える）。
"use client";

import { useEffect, useState } from "react";

const SHOW_UNTIL = Date.parse("2026-10-31T23:59:59+09:00");

export default function SecurityNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(Date.now() <= SHOW_UNTIL);
  }, []);
  if (!show) return null;
  return (
    <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900">
      <div className="max-w-5xl mx-auto px-4 py-2.5 text-xs md:text-sm leading-relaxed">
        <span className="font-bold">【お知らせ】PHPの脆弱性（2026年10月公表）について：</span>
        当サイトはPHPを使用していないため、影響はありません。
        また、お申し込み・お問い合わせでいただいたお名前・ご連絡先などの個人情報は、当サイトのデータベースには保存していません。安心してご利用ください。
      </div>
    </div>
  );
}
