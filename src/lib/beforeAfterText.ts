// @/src/lib/beforeAfterText.ts
// 作業実績（BeforeAfter）の説明文。
// 以前は「【ビフォー】…【アフター】…」の2つに分けて保存していたが、2026-10 から1つの文章に統一。
// 移行SQLで既存データも1つにまとめるが、万一旧形式が残っていても1つの文章として扱えるようにする。
export function mergeLegacyDescription(desc?: string | null): string {
  if (!desc) return "";
  if (!desc.includes("【ビフォー】") && !desc.includes("【アフター】")) return desc.trim();
  return desc
    .replace(/【ビフォー】[ \t]*\r?\n?/g, "")
    .replace(/\s*【アフター】[ \t]*\r?\n?/g, "\n\n")
    .trim();
}
