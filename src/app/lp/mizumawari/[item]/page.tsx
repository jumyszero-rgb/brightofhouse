// @/src/app/lp/mizumawari/[item]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LpTemplate from "@/components/lp/LpTemplate";
import {
  getMizumawariContent,
  MIZUMAWARI_ITEM_KEYS,
} from "@/lib/lpContent";

// 品目別に静的生成（kitchen / bathroom / rangehood / senmen / toilet）
export function generateStaticParams() {
  return MIZUMAWARI_ITEM_KEYS.map((item) => ({ item }));
}

type Props = { params: Promise<{ item: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { item } = await params;
  if (!(MIZUMAWARI_ITEM_KEYS as string[]).includes(item)) return {};
  const c = getMizumawariContent(item);
  return {
    title: c.hero.title,
    description: c.hero.subtitle,
    robots: { index: false, follow: true },
    alternates: { canonical: `/lp/mizumawari/${item}` },
  };
}

export default async function Page({ params }: Props) {
  const { item } = await params;
  if (!(MIZUMAWARI_ITEM_KEYS as string[]).includes(item)) notFound();
  return <LpTemplate content={getMizumawariContent(item)} />;
}
