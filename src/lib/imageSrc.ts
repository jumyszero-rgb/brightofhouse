// @/src/lib/imageSrc.ts
/**
 * next/image で最適化（縮小・WebP化）できる画像か。next.config の images 設定で許可している配信元だけ。
 *  - サイト内の画像（/images/... など・クエリなし）
 *  - R2 の公開URL（https://pub-xxxx.r2.dev/...）
 * それ以外の外部URLを next/image に渡すとエラーになるため、通常の <img> で表示する。
 */
export function isOptimizableSrc(src: string | null | undefined): boolean {
  if (!src) return false;
  if (src.includes("?")) return false;
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  return /^https:\/\/pub-[^/.]+\.r2\.dev\//.test(src);
}
