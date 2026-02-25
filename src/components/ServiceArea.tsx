// @/src/components/ServiceArea.tsx
export default function ServiceArea() {
  return (
    <section className="py-16 px-4 bg-slate-50 border-t border-slate-200">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center justify-center gap-2">
          <span className="text-blue-600">📍</span> 対応エリア
        </h2>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* 札幌市内 */}
            <div>
              <h3 className="text-lg font-bold text-blue-600 mb-4 border-b-2 border-blue-100 pb-2 inline-block">
                札幌市 全域
              </h3>
              <ul className="text-slate-600 space-y-2 font-medium">
                <li>中央区 / 北区 / 東区</li>
                <li>白石区 / 厚別区 / 豊平区</li>
                <li>清田区 / 南区 / 西区 / 手稲区</li>
              </ul>
            </div>

            {/* 近郊エリア */}
            <div>
              <h3 className="text-lg font-bold text-green-600 mb-4 border-b-2 border-green-100 pb-2 inline-block">
                札幌市 近郊
              </h3>
              <ul className="text-slate-600 space-y-2 font-medium">
                <li>江別市 / 北広島市</li>
                <li>恵庭市 / 千歳市</li>
                <li>石狩市 / 小樽市</li>
                <li className="text-sm text-slate-400 mt-2">※その他エリアもご相談ください</li>
              </ul>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-sm text-slate-500">
            <p>
              出張費は原則いただいておりませんが、<br className="md:hidden" />
              遠方の場合は別途ご相談させていただく場合がございます。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}