// @/src/app/api/booking-min-rules/route.ts
// 予約フォーム用：大分類ごとの「最低申込点数」ルールを返す（公開・読み取りのみ）。
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type MinItemsRule = { enabled?: boolean; min?: number; from?: string; to?: string } | null;

export async function GET() {
  try {
    const cats: { id: string; title: string; minItemsRule: unknown }[] = await prisma.bookingCategory.findMany({
      select: { id: true, title: true, minItemsRule: true },
    });
    type Row = { categoryId: string; title: string; rule: MinItemsRule };
    const rules = cats
      .map((c): Row => ({ categoryId: c.id, title: c.title, rule: c.minItemsRule as MinItemsRule }))
      .filter((r: Row) => !!r.rule?.enabled && (r.rule?.min ?? 0) >= 2)
      .map((r: Row) => ({
        categoryId: r.categoryId,
        title: r.title,
        min: Number(r.rule!.min),
        from: r.rule!.from || "",
        to: r.rule!.to || "",
      }));
    return NextResponse.json(rules);
  } catch (e: any) {
    console.error("booking-min-rules error:", e?.message);
    return NextResponse.json([]);
  }
}
