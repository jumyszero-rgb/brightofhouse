// @/src/app/admin/page.tsx
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">管理画面ダッシュボード</h1>
          <Link href="/" className="text-sm text-blue-600 hover:underline">サイトを確認する ➝</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          <Link href="/admin/top-menu" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-yellow-500">
            <h2 className="text-xl font-bold text-gray-800 mb-2">トップ人気メニュー</h2>
            <p className="text-gray-600 text-sm">トップページの人気メニューカードを編集します。</p>
          </Link>

          <Link href="/admin/top-prices" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-red-500">
            <h2 className="text-xl font-bold text-gray-800 mb-2">トップ価格アピール</h2>
            <p className="text-gray-600 text-sm">トップページの単品価格表示を編集します。</p>
          </Link>

          <Link href="/admin/service-pages" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-800">
            <h2 className="text-xl font-bold text-gray-800 mb-2">サービス詳細ページ管理</h2>
            <p className="text-gray-600 text-sm">各サービスの深掘り解説ページを作成・編集します。</p>
          </Link>

          <Link href="/admin/services" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-cyan-500">
            <h2 className="text-xl font-bold text-gray-800 mb-2">サービス・料金表</h2>
            <p className="text-gray-600 text-sm">詳細な料金表（アコーディオン形式）を編集します。</p>
          </Link>

          <Link href="/admin/before-after" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500">
            <h2 className="text-xl font-bold text-gray-800 mb-2">実績(Before/After)</h2>
            <p className="text-gray-600 text-sm">清掃実績の登録・編集・削除を行います。</p>
          </Link>

          <Link href="/admin/blog" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-indigo-600">
            <h2 className="text-xl font-bold text-gray-800 mb-2">AIブログ投稿</h2>
            <p className="text-gray-600 text-sm">AI（Gemini）を活用して記事を生成・投稿します。</p>
          </Link>

          <Link href="/admin/blog/settings" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-slate-400">
            <h2 className="text-xl font-bold text-gray-800 mb-2">AIブログ定型文設定</h2>
            <p className="text-gray-600 text-sm">執筆時に自動挿入するキーワードや定型文を管理します。</p>
          </Link>

          <Link href="/admin/cta-blocks" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-red-500">
            <h2 className="text-xl font-bold text-gray-800 mb-2">🔥 CTAブロック管理</h2>
            <p className="text-gray-600 text-sm">記事に挿入するCTAブロックのデザインを作成・編集します。</p>
          </Link>

          <Link href="/admin/lp" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-pink-500">
            <h2 className="text-xl font-bold text-gray-800 mb-2">LP・地域ページ作成</h2>
            <p className="text-gray-600 text-sm">キャンペーン広告や地域別専用ページを作成します。</p>
          </Link>

          <Link href="/admin/bookings" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-emerald-500">
            <h2 className="text-xl font-bold text-gray-800 mb-2">予約一覧・対応管理</h2>
            <p className="text-gray-600 text-sm">届いた予約申し込みの確認、ステータス変更、削除を行います。</p>
          </Link>

          <Link href="/admin/calendar" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-orange-500">
            <h2 className="text-xl font-bold text-gray-800 mb-2">カレンダー空き枠調整</h2>
            <p className="text-gray-600 text-sm">特定の日時を「×（休み）」や「▲（要相談）」に手動で切り替えます。</p>
          </Link>

          <Link href="/admin/hero" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-purple-500">
            <h2 className="text-xl font-bold text-gray-800 mb-2">ヒーローエリア設定</h2>
            <p className="text-gray-600 text-sm">トップページのタイトルや高さを変更します。</p>
          </Link>

          <Link href="/admin/videos" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-red-400">
            <h2 className="text-xl font-bold text-gray-800 mb-2">動画管理</h2>
            <p className="text-gray-600 text-sm">プロモーション動画のアップロードを行います。</p>
          </Link>

          <Link href="/admin/areas" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-teal-500">
            <h2 className="text-xl font-bold text-gray-800 mb-2">対応エリア管理</h2>
            <p className="text-gray-600 text-sm">地域カテゴリごとの対応エリアを編集します。</p>
          </Link>

          <Link href="/admin/company" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500">
            <h2 className="text-xl font-bold text-gray-800 mb-2">会社概要の編集</h2>
            <p className="text-gray-600 text-sm">住所や代表者、マップ情報を更新します。</p>
          </Link>

          <Link href="/admin/settings" className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-gray-500">
            <h2 className="text-xl font-bold text-gray-800 mb-2">SEO・サイト設定</h2>
            <p className="text-gray-600 text-sm">robots.txt などの全体設定を編集します。</p>
          </Link>

        </div>
      </div>
    </div>
  );
}
