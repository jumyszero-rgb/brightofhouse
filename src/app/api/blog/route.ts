// @/src/app/api/blog/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch { return false; }
}

async function notifyIndexNow(urls: string[]) {
  const baseUrl = process.env.BASE_URL || "https://brightofhouse.jp";
  const fullUrls = urls.map(url => `${baseUrl}${url}`);

  try {
    const response = await fetch(`${baseUrl}/api/indexnow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: fullUrls }),
    });
    if (!response.ok) {
      console.error("Failed to notify IndexNow:", await response.text());
    } else {
      console.log("Successfully notified IndexNow for:", fullUrls);
    }
  } catch (error) {
    console.error("Error notifying IndexNow:", error);
  }
}

// GET: 記事一覧取得 (検索キーワード対応)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const query = searchParams.get("query"); // ★検索キーワード

  try {
    if (id) {
      const post = await prisma.blogPost.findUnique({ where: { id } });
      return NextResponse.json(post);
    }

    // 検索条件 (公開中の記事のみ)
    const where: any = { status: "PUBLISHED" };
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ];
    }

    const posts = await prisma.blogPost.findMany({ 
      where, // ★検索条件を適用
      orderBy: { createdAt: "desc" } 
    });
    return NextResponse.json(posts);
  } catch (error) { 
    console.error("Blog GET Error:", error);
    return NextResponse.json({ error: "Fetch error" }, { status: 500 }); 
  }
}

// POST: 新規記事作成
export async function POST(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const post = await prisma.blogPost.create({
      data: {
        slug: body.slug,
        title: body.title,
        content: body.content,
        instaContent: body.instaContent,
        xContent: body.xContent,
        googleContent: body.googleContent,
        status: body.status, // ★ ここで status を正しく保存
      },
    });

    if (post.status === "PUBLISHED") {
      await notifyIndexNow([`/blog/${post.slug}`]); // 公開時のみIndexNow通知
    }
    
    return NextResponse.json(post);
  } catch (error) { 
    console.error("Blog POST Error:", error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 }); 
  }
}

// PUT: 記事更新
export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const post = await prisma.blogPost.update({
      where: { id: body.id },
      data: {
        slug: body.slug,
        title: body.title,
        content: body.content,
        instaContent: body.instaContent,
        xContent: body.xContent,
        googleContent: body.googleContent,
        status: body.status, // ★ ここで status を正しく更新
      },
    });

    // 公開中、またはステータスが「公開」に変わった場合のみIndexNow通知
    if (post.status === "PUBLISHED" || body.status === "PUBLISHED") {
      await notifyIndexNow([`/blog/${post.slug}`]);
    }

    return NextResponse.json(post);
  } catch (error) { 
    console.error("Blog PUT Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 }); 
  }
}

// DELETE: 記事削除
export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await request.json();
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new Error("Post not found");

    await prisma.blogPost.delete({ where: { id } });

    await notifyIndexNow([`/blog/${post.slug}`]); // 削除されたURLを通知
    
    return NextResponse.json({ success: true });
  } catch (error) { 
    console.error("Blog DELETE Error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 }); 
  }
}