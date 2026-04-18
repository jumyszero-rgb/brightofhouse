// @/src/components/ServiceArea.tsx
import prisma from "@/lib/prisma";

export default async function ServiceArea() {
  // DBからエリア情報を取得
  const areas = await prisma.serviceArea.findMany({
    orderBy: { order: "asc" },
  });

  if (areas.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-slate-50 border-t border-slate-200">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center justify-center gap-2">
          <span className="text-blue-600">📍</span> 対応エリア
        </h2>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
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
                  <p className="text-sm text-slate-400 mt-2">
                    {area.note}
                  </p>
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
      </div>
    </section>
  );
}