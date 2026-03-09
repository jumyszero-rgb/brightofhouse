// @/src/components/Breadcrumbs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const routeMap: { [key: string]: { label: string; api?: string; } } = {
  "lp": { label: "キャンペーン一覧", api: "/api/lp" },
  "area": { label: "地域別サービス一覧", api: "/api/lp" }, // LPとAPIは共有
  "blog": { label: "ブログ一覧", api: "/api/blog" },
  "service": { label: "サービス・料金" },
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
        
        let label = routeMap[segment]?.label;
        let itemTitle: string | undefined;

        if ((segment === "lp" || segment === "area" || segment === "blog") && segments[i + 1]) {
          const itemSlug = segments[i + 1];
          const apiPath = routeMap[segment]?.api;

          if (apiPath) {
            try {
              const res = await fetch(`${apiPath}?slug=${itemSlug}`);
              if (res.ok) {
                const data = await res.json();
                // ★修正: data が null でないことを確認してからプロパティにアクセス
                if (data) { 
                  itemTitle = (segment === "blog") ? data.title : (data.linkTitle || data.title);
                } else {
                  console.warn(`No data found for slug: ${itemSlug} in ${apiPath}`);
                }
              }
            } catch (error) {
              console.error(`Failed to fetch title for slug: ${itemSlug} from ${apiPath}`, error);
            }
          }
          
          tempSegments.push({ 
            href: currentAccumulatedPath.replace(`/${itemSlug}`, ''), 
            label: label || segment, 
            isLast: false 
          });
          tempSegments.push({ 
            href: currentAccumulatedPath, 
            label: itemTitle || itemSlug, 
            isLast: isLast 
          });
          i++;
        } else {
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

  return (
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
  );
}