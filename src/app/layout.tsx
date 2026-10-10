// @/src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import TrafficSourceCapture from "@/components/TrafficSourceCapture";
import prisma from "@/lib/prisma";
import { getFontClassName, DEFAULT_FONT_KEY } from "@/lib/fonts";

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
  // 計測ID（GA4 / Google広告）。gtag.js は1本だけ読み込み、<head> で全部 config してからイベントを送る。
  const GA4_ID = "G-LMELPVPT3Z";
  const ADS_ID = "AW-17996016781";
  const ADS_CALL_LABEL = "AW-17996016781/DTKqCPuhmawcEI3ZlYVD";

  // サイトフォント（admin で選択・SiteSettings.fontKey）。未設定/取得失敗時は既定フォント。
  let fontKey = DEFAULT_FONT_KEY;
  try {
    const s = await prisma.siteSettings.findUnique({ where: { id: "main" }, select: { fontKey: true } });
    if (s?.fontKey) fontKey = s.fontKey;
  } catch {
    // DB未接続時などは既定フォントで継続
  }
  const fontClass = getFontClassName(fontKey);

  return (
    <html lang="ja">
      <head>
        {/*
          計測タグ（全ページ・LP含む）。
          ・以前は GA4 を @next/third-parties（画面の準備完了後に注入）、広告タグを body 末尾で読んでいたため、
            サンキューページの generate_lead が「GA4 の config より先」に送られ GA4 に届いていなかった。
          ・HTML直書きで <head> の最初に GA4 と広告の両方を config → その後のイベントは必ず両方に届く。
        */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA4_ID}');
gtag('config', '${ADS_ID}');
gtag('config', '${ADS_CALL_LABEL}', { 'phone_conversion_number': '0120-792-684' });
`,
          }}
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="北海道ブライトオブハウス 公式ブログ"
          href="/rss.xml"
        />
      </head>
      <body className={`${fontClass} text-slate-800 pb-16 md:pb-0`}>
        {/* 広告流入（gclid / utm_*）をランディング時に保存。フォーム送信時にメールへ載せる。 */}
        <TrafficSourceCapture />

        {/* chrome（Header/footer等）は SiteShell が pathname で出し分ける */}
        <SiteShell>{children}</SiteShell>

      </body>
    </html>
  );
}
