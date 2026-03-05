// @/src/components/RegionalLinks.tsx
import Link from "next/link";

type Props = {
  items: {
    id: string;
    slug: string;
    title: string;
  }[];
};

export default function RegionalLinks({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="bg-slate-50 py-16 px-4 border-t border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-800">
            地域別ハウスクリーニング・清掃サービス
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            各地域の詳細なサービス内容・料金・実績をご確認いただけます。
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/area/${item.slug}`}
              className="bg-white border border-slate-200 p-3 rounded-lg text-center text-sm font-medium text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:shadow-sm transition-all"
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}