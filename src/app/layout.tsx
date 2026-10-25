// @/src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import TrafficSourceCapture from "@/components/TrafficSourceCapture";
import prisma from "@/lib/prisma";
import { memo } from "@/lib/serverMemo";
import { DEFAULT_FONT_KEY } from "@/lib/fonts";
import SiteFont from "@/components/site-font/SiteFont";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://brightofhouse.jp"),
  title: {
    default: "札幌の水回りクリーニング・ハウスクリーニング｜北海道ブライトオブハウス",
    template: "%s｜北海道ブライトオブハウス",
  },
  description:
    "札幌市を中心に、浴室・キッチン等の水回り清掃から、壁紙再生・床ワックス剥離、ゴミ屋敷片付け・遺品整理までプロの技術で迅速対応。お見積り無料。",
  // canonical は各ページで個別設定（layout には置かない）
  openGraph: {
    title: "北海道ブライトオブハウス",
    description:
      "プロの技術で、見違えるほどの輝きを。札幌のハウスクリーニング専門店。",
    url: "https://brightofhouse.jp",
    siteName: "北海道ブライトオブハウス",
    locale: "ja_JP",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  // スマホ（iPhone等）が文章中の「札幌市…」を住所と判定して地図リンクを勝手に付けるのを止める
  // （例：空室LPの施工事例「札幌市 空室ハウスクリーニング｜3LDK…」がGoogleマップへのリンクになっていた）。
  // 電話番号は計測のため PhoneLink（tel:リンク）で明示しているので、自動リンクは住所・メールのみ止める。
  formatDetection: {
    address: false,
    email: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 計測ID（GA4 / Google広告）。Googleタグは1系統だけ読み込み、<head> で全部 config してからイベントを送る。
  const GA4_ID = "G-LMELPVPT3Z";
  const ADS_ID = "AW-17996016781";
  const ADS_CALL_LABEL = "AW-17996016781/DTKqCPuhmawcEI3ZlYVD";
  // Cloudflare の Google tag gateway の計測パス（Cloudflare の設定と同じ値。変更したらここも合わせる）
  const TAG_GATEWAY_PATH = "wd9j";

  // サイトフォント（admin で選択・SiteSettings.fontKey）。未設定/取得失敗時は既定フォント。
  let fontKey = DEFAULT_FONT_KEY;
  try {
    // 全ページで使うので作り置き（admin のサイト設定を保存すると消える）
    const s = await memo("settings:fontKey", () =>
      prisma.siteSettings.findUnique({ where: { id: "main" }, select: { fontKey: true } })
    );
    if (s?.fontKey) fontKey = s.fontKey;
  } catch {
    // DB未接続時などは既定フォントで継続
  }
  return (
    <html lang="ja">
      <head>
        {/*
          計測タグ（全ページ・LP含む）— Googleタグは1本（GA4と広告を結合済みのGoogleタグ）。
          【2026-10-18 遅延読み込み】
          Googleタグ（約200KB）が画面を描くタイミングで動き、表示（LCP）と操作開始（TBT）を遅らせていた。
          → 画面が表示された後に読み込む。きっかけは次のどれか早いもの：
             ・お客さんの最初の操作（スクロール・タップ・クリック・キー入力）
             ・ページの読み込み完了（load）から3秒後
          ・読み込み前に送ったイベント（電話タップ・LINE・フォーム送信など）は dataLayer に積まれ、読み込み後にまとめて送られる
          ・window.__bhLoadGtag() で即時読み込みもできる（フォーム送信時に使用）
          ・Cloudflare の Google tag gateway がタグを自動挿入している場合（/wd9j/ のスクリプトがある場合）は、
            それがすでに読み込み中なので遅延はできない → 従来どおりの保険だけ動かす
          【2026-10-25 判断】Cloudflare の Google タグ ゲートウェイは「オフ」で運用する。
            オンにすると「タグを設定する」をオフにしていても Cloudflare が <head> の先頭にタグを必ず入れ、
            遅延読み込みが効かなくなる（PageSpeed /lp/akishitsu モバイル：オン 69〜72 ／ オフ 95）。
            Google広告の最適化案「タグが独自のドメインから配信されていない」は出たままになるが、表示速度を優先する。
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
(function(){
  // 管理画面ではGoogleタグを読み込まない（計測不要・タブレット/スマホでの管理操作を軽くするため）
  if (location.pathname.indexOf('/admin') === 0) { window.__bhLoadGtag = function(){}; return; }
  var loaded = false;
  var direct = 'https://www.googletagmanager.com/gtag/js?id=${GA4_ID}';
  function loadTag(){
    if (loaded) return; loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = direct;
    document.head.appendChild(s);
  }
  function onLoaded(fn){
    if (document.readyState === 'complete') fn();
    else window.addEventListener('load', fn);
  }
  var gw = document.querySelector('script[src*="/${TAG_GATEWAY_PATH}/"]');
  if (gw) {
    // Cloudflare が自動挿入したタグを使う（失敗した時だけ gtag.js を読む）
    window.__bhLoadGtag = function(){};
    gw.addEventListener('error', loadTag);
    onLoaded(function(){ setTimeout(function(){ if (!window.google_tag_manager) loadTag(); }, 3000); });
    return;
  }
  // 遅延読み込み
  gtag('js', new Date());
  var evs = ['pointerdown', 'touchstart', 'keydown', 'scroll'];
  function go(){
    loadTag();
    evs.forEach(function(e){ window.removeEventListener(e, go); });
  }
  window.__bhLoadGtag = go;
  evs.forEach(function(e){ window.addEventListener(e, go, { passive: true }); });
  onLoaded(function(){ setTimeout(go, 3000); });
})();
gtag('config', '${GA4_ID}');
gtag('config', '${ADS_ID}');
gtag('config', '${ADS_CALL_LABEL}', { 'phone_conversion_number': '0120-792-684' });
`,
          }}
        />
        {/* サイトフォント：選択中の1フォント・2ウェイトだけを自社ドメインから配信（next/font・外部接続なし） */}
        <SiteFont fontKey={fontKey} />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="北海道ブライトオブハウス 公式ブログ"
          href="/rss.xml"
        />
      </head>
      <body className="text-slate-800 pb-16 md:pb-0">
        {/* 広告流入（gclid / utm_*）をランディング時に保存。フォーム送信時にメールへ載せる。 */}
        <TrafficSourceCapture />

        {/* chrome（Header/footer等）は SiteShell が pathname で出し分ける */}
        <SiteShell>{children}</SiteShell>

      </body>
    </html>
  );
}
