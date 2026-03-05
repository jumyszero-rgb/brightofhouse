// @/src/components/Breadcrumbs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// URLのスラッグを日本語に変換する辞書
const labelMap: { [key: string]: string } = {
  "service": "サービス・料金",
  "before-after": "清掃実績",
  "company": "会社概要",
  "contact": "お問い合わせ",
  "lp": "キャンペーン",
  "blog": "ブログ",
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/") return null; // トップページでは表示しない

  const paths = pathname.split("/").filter((v) => v);
  let accumulatedPath = "";

  return (
    <nav aria-label="Breadcrumb" className="bg-slate-50 py-3 px-4 border-b border-slate-200">
      <ol className="max-w-6xl mx-auto flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <li>
          <Link href="/" className="hover:text-blue-600 transition-colors">ホーム</Link>
        </li>
        {paths.map((path, index) => {
          accumulatedPath += `/${path}`;
          const label = labelMap[path] || path; // 辞書になければスラッグをそのまま表示
          const isLast = index === paths.length - 1;

          return (
            <li key={path} className="flex items-center gap-2">
              <span>/</span>
              {isLast ? (
                <span className="font-bold text-slate-800 truncate max-w-[200px]" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link href={accumulatedPath} className="hover:text-blue-600 transition-colors">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}