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
  // HTMLにはIDやURLをそのままの形で載せない（Cloudflare の自動挿入よけ）。分けたものを JSON で埋め込み、ブラウザで組み立てる
  const parts = (v: string, sep: string) => JSON.stringify(v.split(sep));
  const partsGa = parts(GA4_ID, "-");
  const partsAds = parts(ADS_ID, "-");
  const partsPath = JSON.stringify([TAG_GATEWAY_PATH.slice(0, 2), TAG_GATEWAY_PATH.slice(2)]);
  const partsHost = parts("www.googletagmanager.com", ".");
  const callLabel = JSON.stringify(ADS_CALL_LABEL.split("/")[1]);

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
          【2026-10-25 v2】Cloudflare は「タグを設定する」がオフでも、HTMLの中にGoogleタグ（URL・ID）を見つけると
          先頭に自分のタグ（/wd9j/）を入れてしまい、遅延読み込みが効かなかった（PageSpeed 91→69〜72）。
          → HTMLにはURL・IDを分けた形でだけ載せ、ブラウザで組み立てる。
          【2026-10-25 自社ドメインから読み込み】
          Cloudflare の Google tag gateway（Web タグ管理 → Google タグ ゲートウェイ）を有効にし、
          「タグを設定する」（Cloudflare の自動挿入）はオフ。このスクリプトが /wd9j/?id=G-LMELPVPT3Z を読み込む
          → タグの読み込みも GA4・広告の送信も自社ドメイン（/wd9j/）経由になる。
          /wd9j/ が読めなかったとき（ゲートウェイを無効にした等）だけ googletagmanager.com から直接読む。
          【2026-10-18 遅延読み込み】
          Googleタグ（約200KB）が画面を描くタイミングで動き、表示（LCP）と操作開始（TBT）を遅らせていた。
          → 画面が表示された後に読み込む。きっかけは次のどれか早いもの：
             ・お客さんの最初の操作（スクロール・タップ・クリック・キー入力）
             ・ページの読み込み完了（load）から3秒後
          ・読み込み前に送ったイベント（電話タップ・LINE・フォーム送信など）は dataLayer に積まれ、読み込み後にまとめて送られる
          ・window.__bhLoadGtag() で即時読み込みもできる（フォーム送信時に使用）
          ・Cloudflare 側の「タグを設定する」をオンにして自動挿入された場合（/wd9j/ のスクリプトがHTMLにある場合）は、
            それがすでに読み込み中なので遅延はできない → それを使い、失敗したときだけ直接読む
            ※ 遅延を効かせるため、Cloudflare 側の「タグを設定する」はオフのままにする
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
(function(){
  // ※ タグのURL・IDは分けて書き、実行時に組み立てる（HTMLにそのままの形で載せない）。
  //   Cloudflare の Google tag gateway は、HTMLの中にGoogleタグを見つけると自分のタグを先頭に自動で入れるため
  //   （入れられると遅延読み込みが効かなくなる）。
  var J = function(a, sep){ return a.join(sep); };
  var GA = J(${partsGa}, '-');
  var ADS = J(${partsAds}, '-');
  var PATH = '/' + J(${partsPath}, '') + '/';
  var DIRECT_HOST = 'https://' + J(${partsHost}, '.');
  window.__bhTagIds = { ga: GA, ads: ADS, label: ADS + '/' + ${callLabel} };
  var loaded = false;
  // 自社ドメイン（Cloudflare の Google tag gateway の計測パス）から読む。読めなかったときだけ Google から直接読む
  var firstParty = PATH + '?id=' + GA;
  var direct = DIRECT_HOST + '/' + J(['gt', 'ag'], '') + '/js?id=' + GA;
  function addScript(src, onError){
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    if (onError) s.onerror = onError;
    document.head.appendChild(s);
  }
  function loadTag(){
    if (loaded) return; loaded = true;
    addScript(firstParty, function(){ addScript(direct); });
  }
  var directLoaded = false;
  function loadDirect(){
    if (directLoaded) return; directLoaded = true;
    addScript(direct);
  }
  function onLoaded(fn){
    if (document.readyState === 'complete') fn();
    else window.addEventListener('load', fn);
  }
  var gw = document.querySelector('script[src*="' + PATH + '"]');
  if (gw) {
    // Cloudflare が自動挿入したタグがある場合はそれを使う（失敗した時だけ直接読む）
    window.__bhLoadGtag = function(){};
    gw.addEventListener('error', loadDirect);
    onLoaded(function(){ setTimeout(function(){ if (!window.google_tag_manager) loadDirect(); }, 3000); });
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
gtag('config', window.__bhTagIds.ga);
gtag('config', window.__bhTagIds.ads);
gtag('config', window.__bhTagIds.label, { 'phone_conversion_number': '0120-792-684' });
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
