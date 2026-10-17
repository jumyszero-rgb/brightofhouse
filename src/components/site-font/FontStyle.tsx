// @/src/components/site-font/FontStyle.tsx
/** 選ばれたフォントを body（＝サイト全体）に適用する小さな <style>。 */
export default function FontStyle({ family }: { family: string }) {
  return <style>{`html body{font-family:${family};}`}</style>;
}
