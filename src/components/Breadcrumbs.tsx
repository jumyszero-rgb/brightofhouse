// @/src/components/Breadcrumbs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

// ルートパスの日本語ラベルとAPIパスのマッピング
const routeMap: { [key: string]: { label: string; api?: string; } } = {
  "lp": { label: "キャンペーン一覧", api: "/api/lp" },
  "area": { label: "地域別サービス一覧", api: "/api/lp" }, // LPとAPIは共有
  "blog": { label: "ブログ一覧", api: "/api/blog" },
  "service": { label: "サービス・料金", api: "/api/service-pages" },
  "before-after": { label: "清掃実績" },
  "company": { label: "会社概要" },
  "contact": { label: "お問い合わせ" },
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const [pathSegments, setPathSegments] = useState<
    { href: string; label: string; isLast: boolean }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generatePathSegments = async () => {
      setLoading(true);
      if (pathname === "/") {
        setPathSegments([]);
        setLoading(false);
        return;
      }

      const segments = pathname.split("/").filter((v) => v);
      const tempSegments: { href: string; label: string; isLast: boolean }[] = [{ href: "/", label: "ホーム", isLast: false }];
      let currentAccumulatedPath = "";

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        currentAccumulatedPath += `/${segment}`;
        const isLast = i === segments.length - 1;
        
        const config = routeMap[segment];
        let label = config?.label;
        let itemTitle: string | undefined;

        // 次のセグメントがあり、かつ現在のセグメントにAPIが設定されている場合（個別ページ）
        if (config?.api && segments[i + 1]) {
          const itemSlug = segments[i + 1];
          const apiPath = config.api;

          try {
            const res = await fetch(`${apiPath}?slug=${itemSlug}`);
            if (res.ok) {
              const data = await res.json();
              if (data) { 
                // blogの場合はtitleのみ、その他はlinkTitleを優先
                itemTitle = (segment === "blog") ? data.title : (data.linkTitle || data.title);
              }
            }
          } catch (error) {
            console.error(`Failed to fetch title for slug: ${itemSlug}`, error);
          }
          
          // 親カテゴリを追加
          tempSegments.push({ 
            href: currentAccumulatedPath, 
            label: label || segment, 
            isLast: false 
          });

          // 個別ページを追加
          currentAccumulatedPath += `/${itemSlug}`;
          tempSegments.push({ 
            href: currentAccumulatedPath, 
            label: itemTitle || itemSlug, 
            isLast: (i + 1) === segments.length - 1 
          });
          i++; // 個別ページのスラッグ分をスキップ
        } else {
            // 通常のページ
            if (!label && segment.includes('-')) {
              label = segment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            }
            tempSegments.push({
              href: currentAccumulatedPath,
              label: label || segment,
              isLast,
            });
        }
      }
      setPathSegments(tempSegments);
      setLoading(false);
    };

    generatePathSegments();

  }, [pathname]);

  if (loading || pathSegments.length <= 1) return null;

  // Google用構造化データ (JSON-LD) の生成
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: pathSegments.map((segment, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: segment.label,
      item: `https://brightofhouse.jp${segment.href === "/" ? "" : segment.href}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="bg-white py-3 px-4 md:px-8 border-b border-slate-200 shadow-sm text-black">
        <ol className="max-w-7xl mx-auto flex flex-wrap items-center gap-2 text-xs md:text-sm text-slate-500">
          {pathSegments.map((segment, index) => (
            <li key={segment.href + index} className="flex items-center">
              {index > 0 && <span className="mx-1 text-slate-400">/</span>}
              {segment.isLast ? (
                <span className="font-bold text-slate-800 truncate max-w-[200px] md:max-w-none" aria-current="page">
                  {segment.label}
                </span>
              ) : (
                <Link href={segment.href} className="hover:text-blue-600 transition-colors">
                  {segment.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}