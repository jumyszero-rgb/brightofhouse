// @/src/app/api/indexnow/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const INDEXNOW_KEY = "0cf2bc06efdc403e885c5c0957eef7fb";
const SITE_DOMAIN = "brightofhouse.jp";
const INDEXNOW_KEY_LOCATION = `https://${SITE_DOMAIN}/${INDEXNOW_KEY}.txt`;

// ▼ 追加: ブラウザからのアクセス確認用 (GETリクエスト対応)
export async function GET() {
  return NextResponse.json({ 
    status: "online", 
    message: "IndexNow API is active. Please use POST method to submit URLs." 
  });
}

// 既存のPOST処理
export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "URLs are required" }, { status: 400 });
    }

    const indexNowApiUrl = "https://www.bing.com/indexnow";

    // IndexNowサーバーにCloudflare経由のIPを伝える
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'UNKNOWN';

    const response = await fetch(indexNowApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Host": "www.bing.com",
        "X-Forwarded-For": clientIP,
      },
      body: JSON.stringify({
        host: SITE_DOMAIN,
        key: INDEXNOW_KEY,
        keyLocation: INDEXNOW_KEY_LOCATION,
        urlList: urls,
      }),
    });

    if (response.status === 200) {
      console.log(`IndexNow success for ${urls.length} URLs`);
      await prisma.indexNowLog.createMany({
        data: urls.map((url: string) => ({
          url,
          status: response.status,
          response: "OK",
        })),
        skipDuplicates: true,
      });
      return NextResponse.json({ success: true, message: "IndexNow submitted" }, { status: 200 });
    } else {
      const responseText = await response.text();
      console.error(`IndexNow failed: ${response.status} ${response.statusText}`);
      console.error(`IndexNow response: ${responseText}`);
      await prisma.indexNowLog.createMany({
        data: urls.map((url: string) => ({
          url,
          status: response.status,
          response: responseText,
        })),
        skipDuplicates: true,
      });
      return NextResponse.json({ error: "IndexNow submission failed", status: response.status }, { status: 500 });
    }
  } catch (error: any) {
    console.error("IndexNow API error:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}