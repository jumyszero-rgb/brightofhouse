// @/src/components/SmartImage.tsx
/**
 * 背景・カード用の画像（親要素いっぱいに広げて表示する：親は position: relative にしておく）。
 *
 * 【表示速度対策 2026-10】
 * これまで R2 の元画像（1360px など）を <img> でそのまま表示していたため、スマホでも大きい画像を読み込んでいた。
 *  - next/image で最適化できる画像（サイト内・R2）は、表示サイズに合わせて縮小・WebP化して配信（Cloudflareでキャッシュ）
 *  - priority … ファーストビュー（LCP）の画像に付ける。先読み＋最優先で取得し、遅延読み込みしない
 *  - それ以外は画面に近づいてから読み込む（loading="lazy"）
 * ※ サーバー／クライアントどちらのコンポーネントからも使える。
 */
import Image from "next/image";
import { isOptimizableSrc } from "@/lib/imageSrc";

export default function SmartImage({
  src,
  alt = "",
  className = "",
  sizes = "100vw",
  priority = false,
}: {
  src: string;
  alt?: string;
  /** object-cover などの見た目用クラス（位置・大きさは自動で親いっぱい） */
  className?: string;
  /** 表示幅の目安（例："(max-width: 640px) 100vw, 33vw"） */
  sizes?: string;
  priority?: boolean;
}) {
  if (isOptimizableSrc(src)) {
    return priority ? (
      <Image src={src} alt={alt} fill sizes={sizes} preload loading="eager" fetchPriority="high" className={className} />
    ) : (
      <Image src={src} alt={alt} fill sizes={sizes} loading="lazy" className={className} />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`absolute inset-0 w-full h-full ${className}`}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}
