// @/src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import TrafficSourceCapture from "@/components/TrafficSourceCapture";
import prisma from "@/lib/prisma";
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
    const s = await prisma.siteSettings.findUnique({ where: { id: "main" }, select: { fontKey: true } });
    if (s?.fontKey) fontKey = s.fontKey;
  } catch {
    // DB未接続時などは既定フォントで継続
  }
  return (
    <html lang="ja">
      <head>
        {/*
          計測タグ（全ページ・LP含む）— Googleタグは「1系統」だけ。
          ・Cloudflare の Google tag gateway が <head> の先頭に Googleタグ（自社ドメイン /wd9j/ 配信）を自動で挿入している。
            以前はそれに加えて googletagmanager.com の gtag.js もここで読んでいたため、Googleタグが2系統・3本読まれていた。
          ・今は「ゲートウェイのタグがあればそれだけを使う」。ここでは config（GA4・広告・電話番号置き換え）だけを積む。
          ・ゲートウェイが無効になっている時だけ、googletagmanager.com の gtag.js を代わりに読み込む（計測が途切れない保険）。
          ・さらに保険：5秒たっても GA4 のタグが動いていなければ gtag.js を読み込む。
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
(function(){
  var loaded = false;
  function loadDirect(){
    if (loaded) return; loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=${GA4_ID}';
    document.head.appendChild(s);
  }
  var viaGateway = !!document.querySelector('script[src*="/${TAG_GATEWAY_PATH}/"]');
  if (!viaGateway) { gtag('js', new Date()); loadDirect(); }
  else {
    setTimeout(function(){
      var t = window.google_tag_manager;
      if (!t || !t['${GA4_ID}']) loadDirect();
    }, 5000);
  }
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
