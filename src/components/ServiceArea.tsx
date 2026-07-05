// @/src/components/ServiceArea.tsx
import Link from "next/link";
import prisma from "@/lib/prisma";

type RegionalLink = {
  id: string;
  slug: string;
  title: string;
};

type Props = {
  regionalLinks: RegionalLink[];
};

export default async function ServiceArea({ regionalLinks }: Props) {
  // DBからエリア情報を取得
  const areas = await prisma.serviceArea.findMany({
    orderBy: { order: "asc" },
  });

  if (areas.length === 0 && regionalLinks.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-slate-50 border-t border-slate-200">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center justify-center gap-2">
          <span className="text-blue-600">📍</span> 対応エリア
        </h2>

        {areas.length > 0 && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {areas.map((area) => (
                <div key={area.id} className="text-left">
                  <h3 className="text-lg font-bold text-blue-600 mb-4 border-b-2 border-blue-100 pb-2 inline-block">
                    {area.title}
                  </h3>
                  <div className="text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                    {area.regions}
                  </div>
                  {area.note && (
                    <p className="text-sm text-slate-400 mt-2">{area.note}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 text-sm text-slate-500">
              <p>
                ※記載のないエリアについても、お気軽にご相談ください。<br />
                遠方の場合は別途出張費をご相談させていただく場合がございます。
              </p>
            </div>
          </div>
        )}

        {regionalLinks.length > 0 && (
          <div>
            <p className="text-sm text-slate-500 mb-4">
              各地域の対応実績はこちらからご確認いただけます
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {regionalLinks.map((item) => (
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
        )}
      </div>
    </section>
  );
}
