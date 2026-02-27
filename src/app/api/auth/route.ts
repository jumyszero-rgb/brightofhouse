// @/src/app/api/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";
import { sendAuthCode } from "@/lib/mail";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  // 1. ID/PASS検証 & コード送信
  if (action === "login") {
    const { username, password } = body;

    if (
      username !== process.env.ADMIN_USER ||
      password !== process.env.ADMIN_PASS
    ) {
      return NextResponse.json({ error: "IDまたはパスワードが違います" }, { status: 401 });
    }

    // 6桁のコード生成
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分後

    // DBに保存
    await prisma.adminCode.create({
      data: { code, expiresAt },
    });

    // メール送信
    try {
      await sendAuthCode(process.env.ADMIN_EMAIL!, code);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Mail error:", error);
      return NextResponse.json({ error: "メール送信に失敗しました" }, { status: 500 });
    }
  }

  // 2. コード検証 & トークン発行
  if (action === "verify") {
    const { code } = body;

    // 有効なコードを探す
    const validCode = await prisma.adminCode.findFirst({
      where: {
        code,
        expiresAt: { gt: new Date() }, // 期限切れでない
      },
    });

    if (!validCode) {
      return NextResponse.json({ error: "コードが無効か期限切れです" }, { status: 401 });
    }

    // 使用済みコードを削除
    await prisma.adminCode.delete({ where: { id: validCode.id } });

    // JWTトークン生成
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(secret);

    // verifyアクション内のCookieセット部分を修正
    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",  // ← ★ここが "/" になっているか確認。"/admin" ではなく "/" が最も安全です。
      maxAge: 60 * 60 * 24, // 24時間
    });

    return response;
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}