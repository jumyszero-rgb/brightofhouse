// @/src/app/booking/page.tsx
import BookingIntegrated from "@/components/booking/BookingIntegrated";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お見積り・仮予約",
  description:
    "札幌の水回りクリーニング・ハウスクリーニングをネットから簡単仮予約。メニューを選ぶだけでその場で概算お見積りができます。24時間受付。",
  alternates: { canonical: "/booking" },
};

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  // 予約マスターデータ（メニュー・料金等）を取得
  const masterData = await prisma.bookingCategory.findMany({
    include: {
      menus: {
        include: {
          subMenus: {
            include: {
              options: { orderBy: { order: "asc" } }
            },
            orderBy: { order: "asc" },
          }
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800">
            お見積り・仮予約
          </h1>
          <p className="text-slate-600 mt-2">
            メニューを選んで、その場でお見積り。24時間仮予約が可能です。
          </p>
        </div>

        {/* 予約システム統合コンポーネント */}
        <BookingIntegrated masterData={masterData} />

      </div>
    </main>
  );
}