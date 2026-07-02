// @/src/app/blog/page.tsx
import type { Metadata } from "next";
import BlogListClient from "@/components/BlogListClient";

export const metadata: Metadata = {
  title: "ブログ",
  description:
    "プロが教えるお掃除の知恵袋。札幌の水回りクリーニング・ハウスクリーニングのコツや、汚れ別の対処法、季節のお手入れ情報などを発信しています。",
  alternates: { canonical: "/blog" },
};

export default function BlogListPage() {
  return <BlogListClient />;
}
