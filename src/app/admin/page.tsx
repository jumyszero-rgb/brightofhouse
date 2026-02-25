// @/src/app/admin/page.tsx
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">管理画面ダッシュボード</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* ビフォーアフター管理カード */}
          <Link 
            href="/admin/before-after"
            className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-2">Before & After</h2>
            <p className="text-gray-600 text-sm">
              清掃実績の登録・編集・削除を行います。
            </p>
          </Link>

          {/* 会社概要編集カード（ここに追加しました） */}
          <Link 
            href="/admin/company"
            className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-2">会社概要の編集</h2>
            <p className="text-gray-600 text-sm">
              住所、電話番号、Googleマップなどの基本情報を更新します。
            </p>
          </Link>

          <Link 
            href="/admin/hero"
            className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-purple-500"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-2">ヒーローエリア設定</h2>
            <p className="text-gray-600 text-sm">
              トップページ上部のタイトル、高さ、ボタンのリンク先を変更します。
            </p>
          </Link>

          <Link 
            href="/admin/videos"
            className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-red-500"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-2">動画管理</h2>
            <p className="text-gray-600 text-sm">
              プロモーション動画のアップロード・削除を行います。（自動圧縮機能付き）
            </p>
          </Link>
          {/* 実績ギャラリー管理 */}
          <Link 
            href="/admin/gallery"
            className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-orange-500"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-2">実績ギャラリー管理</h2>
            <p className="text-gray-600 text-sm">
              トップページのスライダーに表示する画像を登録します。
            </p>
          </Link>

          {/* メニュー・料金管理 */}
          <Link 
            href="/admin/menu"
            className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-yellow-500"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-2">人気メニュー・料金管理</h2>
            <p className="text-gray-600 text-sm">
              トップページに表示するおすすめプランや料金を編集します。
            </p>
          </Link>
          
          <Link 
            href="/admin/services"
            className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-cyan-500"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-2">サービス・料金表管理</h2>
            <p className="text-gray-600 text-sm">
              詳細な料金表の階層構造（大分類・中分類・詳細）を編集します。
            </p>
          </Link>

          <Link 
          href="/admin/areas"
          className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-teal-500"
          >
          <h2 className="text-xl font-bold text-gray-800 mb-2">対応エリア管理</h2>
          <p className="text-gray-600 text-sm">
          「清掃系」「片付け系」など、カテゴリごとの対応地域を編集します。
          </p>
          </Link>

          {/* 今後追加予定の機能（プレースホルダー） */}
          <div className="bg-gray-200 p-6 rounded-lg border-l-4 border-gray-400 opacity-60">
            <h2 className="text-xl font-bold text-gray-600 mb-2">AIブログ管理</h2>
            <p className="text-gray-500 text-sm">
              (準備中) ブログ記事の生成設定など
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}