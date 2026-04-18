// @/src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // 管理画面の認証チェック
  if (url.pathname.startsWith("/admin")) {
    if (url.pathname === "/admin/login") return NextResponse.next();

    const token = request.cookies.get("admin_token")?.value;
    if (!token) return NextResponse.redirect(new URL("/admin/login", request.url));

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|images|video|icon.png|apple-icon.png).*)",
  ],
};