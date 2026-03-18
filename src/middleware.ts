// @/src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host") || "";

  // 1. wwwありを「なし」にリダイレクト (httpsへ統一)
  if (host.startsWith("www.")) {
    const noWwwHost = host.replace("www.", "");
    return NextResponse.redirect(`https://${noWwwHost}${url.pathname}${url.search}`, 301);
  }

  // 2. 管理画面のアクセス制限
  if (url.pathname.startsWith("/admin")) {
    if (url.pathname === "/admin/login") return NextResponse.next();

    const token = request.cookies.get("admin_token")?.value;
    if (!token) return NextResponse.redirect(new URL("/admin/login", request.url));

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico|images|video|icon.png|apple-icon.png).*)",
};