// @/src/app/api/before-after/generate/route.ts
// 作業実績のAI執筆機能は 2026-10 に削除しました（管理画面からも外しています）。
// このファイルごと削除してもかまいません。残っている場合も、呼ばれたら 410 を返すだけです。
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "この機能は削除されました" }, { status: 410 });
}
