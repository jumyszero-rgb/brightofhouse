// @/src/app/api/indexnow/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // 追加

// Step 1で作成したKeyファイルの名前と内容
const INDEXNOW_KEY = "0cf2bc06efdc403e885c5c0957eef7fb"; // ★あなたのKeyに書き換える
const INDEXNOW_KEY_LOCATION = `https://brightofhouse.jp/${INDEXNOW_KEY}.txt`;

export async function POST(request: NextRequest) {
  const { urls } = await request.json(); // 更新されたURLの配列を受け取る

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: "URLs are required" }, { status: 400 });
  }

  const indexNowApiUrl = "https://www.bing.com/indexnow";

  try {
    const response = await fetch(indexNowApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Host": "www.bing.com",
      },
      body: JSON.stringify({
        host: "brightofhouse.jp", // ★あなたのドメイン
        key: INDEXNOW_KEY,
        keyLocation: INDEXNOW_KEY_LOCATION,
        urlList: urls,
      }),
    });

    if (response.status === 200) {
      console.log(`IndexNow success for ${urls.length} URLs`);
      // ▼ 追加: 成功した通知をDBに記録
      await prisma.indexNowLog.createMany({
        data: urls.map((url: string) => ({
          url,
          status: response.status,
          response: "OK",
        })),
        skipDuplicates: true, // 同じURLがすでにログにあってもエラーにならない
      });
      return NextResponse.json({ success: true, message: "IndexNow submitted" }, { status: 200 });
    } else {
      const responseText = await response.text();
      console.error(`IndexNow failed: ${response.status} ${response.statusText}`);
      console.error(`IndexNow response: ${responseText}`);
      // ▼ 追加: 失敗した通知もDBに記録
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