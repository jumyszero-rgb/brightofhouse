// @/src/components/PrivacyStorageNote.tsx
// 申し込み・お問い合わせフォームの送信ボタン近くに出す「個人情報はデータベースに保存しません」の注記。
// カレンダー予約（/api/booking）・お問い合わせフォーム（/api/lead）とも、個人情報はデータベースに保存せず、
// 担当者への通知メールとお客様への控えメールにだけ使う（2026-10 時点の実装と一致させること）。
// photos：写真を添付できるフォーム（お問い合わせフォーム）。写真はお見積りのためにファイル保管庫へ保存するので、その旨も書く
export default function PrivacyStorageNote({ className = "", photos = false }: { className?: string; photos?: boolean }) {
  return (
    <p className={`text-[11px] leading-relaxed text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 ${className}`}>
      🔒 お名前・ご連絡先・ご住所などの個人情報は、当サイトのデータベースには保存しません。担当者へのご連絡（メール）と、お客様への控えメールにのみ使用します。
      {photos && <>なお、添付いただいた写真は、お見積りの確認のために保管します。</>}
    </p>
  );
}
