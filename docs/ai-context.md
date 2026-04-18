📄 開発引継ぎ書（AIアシスタント用コンテキスト）

1. プロジェクト概要
プロジェクト名: braightofhouse.jp
目的: 自社のホームページ braightofhouse.jp の作成
特徴: アドミンログイン機能を持ち、コードなしでブログ、ビフォーアフター実績、LP、サービス・料金ページを管理・作成できる。AI（Gemini）による執筆アシスタント機能を統合。

2. 技術スタックとインフラ
- フロントエンド / API: Next.js 15/16 (App Router / Turbopack)
- データベース: Supabase (PostgreSQL) + Prisma ORM
- 認証: JWTベースの認証（管理画面）
- ストレージ: Cloudflare R2 (AWS SDK v3)
- 画像処理: Sharp (WebP変換・リサイズ、エラー時のフォールバック機能付き)
- エディタ: BlockNote / RichTextEditor + AI執筆機能

3. 実装・修正済みの主要機能（2026/04 最新更新）

■ ビフォーアフター管理
- 【復旧】AI執筆機能を「ビフォ文」「アフター文」の2分割形式に刷新。
- 【UI改善】管理画面でビフォーとアフターの状態を個別に編集・確認可能に。
- 【表示改善】公開側で「BEFORE/AFTER」のラベル付き分割表示に対応。
- 【安定化】Sharpのバイナリエラー対策（動的インポートとフォールバック）を導入し、画像アップロードの失敗を解消。
❌ The request signature we calculated does not match the signature you provided. Check your secret access key and signing method.
POST Detailed Error: SignatureDoesNotMatch: The request signature we calculated does not match the signature you provided. Check your secret access key and signing method.
    at async uploadToR2 (src/app/api/before-after/route.ts:53:3)
    at async POST (src/app/api/before-after/route.ts:95:35)
  51 |   }
  52 |
> 53 |   await r2Client.send(new PutObjectCommand({
     |   ^
  54 |     Bucket: process.env.R2_BUCKET_NAME,
  55 |     Key: fileName,
  56 |     Body: uploadBuffer, {
  '$fault': 'client',
  '$retryable': undefined,
  '$metadata': [Object],
  Code: 'SignatureDoesNotMatch',
  StringToSign: 'AWS4-HMAC-SHA256\n' +
    '20260418T212819Z\n' +
    '20260418/auto/s3/aws4_request\n' +
    'c05136a2f310ab2d9bb80df013d7b14fd46065a01f966b608a746fc7354063d9',
  StringToSignBytes: '41 57 53 34 2d 48 4d 41 43 

■ 予約カレンダーシステム
- 【機能追加】管理画面での「ドラッグによる範囲選択・一括ステータス変更」機能を実装。
- 【仕様変更】カレンダー記号を「△」から視認性の高い「▲」へ統一。
- 【自動化】今日より前の過去枠を自動的に「×」固定とし、操作・予約不可に設定。
- 【UI/UX】カレンダーの初期表示を「今日」からに変更。
- 【レスポンシブ】モバイル端末でカレンダーが隠れないよう、画面幅に応じた自動縮小表示に対応。

■ 予約・お問い合わせフォーム
- 【文言刷新】タイトルを「ネットで即時見積・仮予約・このサービスについてのお問い合わせ」に変更し、注釈（日時選択の必要性、確定ではない旨）を追加。
- 【項目追加】「ご確認のご連絡方法（お電話・メール・SMS）」の選択肢を追加。
- 【導線改善】トップページおよびサービス詳細ページのボタンリンクを、予約セクション（#booking-section）へ正しく誘導するよう修正。

■ システム全般
- 【バグ修正】ServicePageのハイドレーションエラー（details/summaryタグの不正なネスト）を解消。
- 【安定化】ミドルウェアのリダイレクト処理およびR2接続設定（forcePathStyleの最適化）を修正。
- 【環境整備】パーミッションエラー（os error 13）の回避と、プロセスのクリーンアップ手順を確立。

4. 今後の実装タスク（Next Steps）
- 作業一覧ページ（サービス一覧）のさらなるカテゴリ整理とアドミンでの柔軟な並べ替え。
- LP（キャンペーン・地域別）のブロックエディタ機能の拡充。
- SEOメタデータのAI自動生成機能の精度向上。
- 各種メール通知テンプレートの文言調整。

5. 開発時の注意
- Prisma schema 変更時は `npx prisma generate` を忘れずに行うこと。
- 画像アップロードは `src/app/api/before-after/route.ts` の堅牢なアップロード関数（uploadToR2）を参考にすること。
- Hydration Error 防ぐため、セマンティックなHTMLタグ（details, p, dl等）のネスト規則を遵守すること。
