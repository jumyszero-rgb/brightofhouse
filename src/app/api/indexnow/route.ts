// @/src/app/api/indexnow/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { notifyGoogleIndexing } from "@/lib/google-indexing";

const INDEXNOW_KEY = "0cf2bc06efdc403e885c5c0957eef7fb";
const SITE_DOMAIN = "brightofhouse.jp";
const INDEXNOW_KEY_LOCATION = `https://${SITE_DOMAIN}/${INDEXNOW_KEY}.txt`;

export async function GET() {
  return NextResponse.json({ 
    status: "online", 
    message: "Indexing API is active (Bing & Google)." 
  });
}

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "URLs are required" }, { status: 400 });
    }

    // 1. Bing (IndexNow) への送信
    const indexNowApiUrl = "https://www.bing.com/indexnow";
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'UNKNOWN';

    const bingPromise = fetch(indexNowApiUrl, {
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

    // 2. Google (Indexing API) への送信
    const googlePromises = urls.map(url => notifyGoogleIndexing(url));

    // すべての結果を待機 (どれかが失敗してもログは残す)
    const results = await Promise.allSettled([bingPromise, ...googlePromises]);
    
    const bingResult = results[0];
    const isBingSuccess = bingResult.status === 'fulfilled' && (bingResult.value as any).status === 200;

    // ログ記録
    await prisma.indexNowLog.createMany({
      data: urls.map((url: string) => ({
        url,
        status: isBingSuccess ? 200 : 500,
        response: isBingSuccess ? "OK (Bing & Google)" : "Check Logs for Details",
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Critical indexing error:", error.message);
    return NextResponse.json({ error: "Submission process failed" }, { status: 500 });
  }
}