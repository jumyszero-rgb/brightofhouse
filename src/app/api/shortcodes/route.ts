// @/src/app/api/shortcodes/route.ts
// ショートコード管理API（管理者のみ）。GET=一覧 / POST=作成 / PUT=更新 / DELETE=削除
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
  } catch {
    return false;
  }
}

// キーの正規化・検証（英数字・ハイフン・アンダースコアのみ）
function normalizeKey(raw: string): string | null {
  const k = (raw || "").trim();
  if (!/^[A-Za-z0-9_-]+$/.test(k)) return null;
  return k;
}

export async function GET() {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const items = await prisma.shortcode.findMany({ orderBy: { updatedAt: "desc" } });
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json({ error: "List failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { key, name, html } = await request.json();
    const nk = normalizeKey(key);
    if (!nk) return NextResponse.json({ error: "キーは英数字・ハイフン・アンダースコアのみ使えます" }, { status: 400 });
    const exists = await prisma.shortcode.findUnique({ where: { key: nk } });
    if (exists) return NextResponse.json({ error: "そのキーは既に使われています" }, { status: 409 });
    const created = await prisma.shortcode.create({
      data: { key: nk, name: name || nk, html: html || "" },
    });
    return NextResponse.json(created);
  } catch (e) {
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, key, name, html } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const nk = normalizeKey(key);
    if (!nk) return NextResponse.json({ error: "キーは英数字・ハイフン・アンダースコアのみ使えます" }, { status: 400 });
    // 別レコードが同じキーを使っていないか
    const dup = await prisma.shortcode.findUnique({ where: { key: nk } });
    if (dup && dup.id !== id) return NextResponse.json({ error: "そのキーは既に使われています" }, { status: 409 });
    const updated = await prisma.shortcode.update({
      where: { id },
      data: { key: nk, name: name || nk, html: html || "" },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await prisma.shortcode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
