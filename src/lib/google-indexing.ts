// @/src/lib/google-indexing.ts
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/indexing"];

export async function notifyGoogleIndexing(url: string) {
  try {
    // 認証クライアントの作成
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: SCOPES,
    });

    // 型定義の競合を避けるため、anyとしてAPIを初期化
    // これにより「v1」「v3」などのバージョン不一致エラーを完全に回避します
    const indexing: any = google.indexing({
      version: "v1",
      auth: auth,
    } as any);

    // 通知の送信
    const res = await indexing.urlNotifications.publish({
      requestBody: {
        url: url,
        type: "URL_UPDATED",
      },
    });

    console.log(`Google Indexing success: ${url}`);
    return res.data;
  } catch (error: any) {
    console.error("Google Indexing error:", error.message);
    throw error;
  }
}