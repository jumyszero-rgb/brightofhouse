// @/src/app/before-after/page.tsx
// import { PrismaClient } from "@prisma/client"; // ← 削除
import prisma from "@/lib/prisma"; // ← 追加
import BeforeAfterList from "@/components/BeforeAfterList";

export const dynamic = "force-dynamic";

// const prisma = new PrismaClient(); // ← 削除

export default async function BeforeAfterPage() {
  // データベースから全件取得
  const items = await prisma.beforeAfter.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-slate-50 py-20 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">
            清掃実績
            <span className="block text-lg font-normal text-slate-500 mt-2">
              Before & After
            </span>
          </h1>
          <p className="text-slate-600">
            プロの技術による劇的な変化をご覧ください。<br />
            スライダーを左右に動かすと比較できます。
          </p>
        </div>

        {/* 検索機能付きリストコンポーネント */}
        <BeforeAfterList items={items} />
        
      </div>
    </main>
  );
}