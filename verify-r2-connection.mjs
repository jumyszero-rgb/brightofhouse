import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const accountId = process.env.R2_ACCOUNT_ID?.trim();
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
  forcePathStyle: true,
});

async function run() {
  console.log("接続チェックを開始します...");
  try {
    const res = await s3.send(new ListBucketsCommand({}));
    console.log("✅ 接続成功！認証情報は正しく認識されています。");
    console.log("アクセス可能なバケット:", res.Buckets.map(b => b.Name).join(", "));
  } catch (err) {
    console.error("❌ 接続エラー:");
    console.error("エラーコード:", err.name);
    console.error("エラー詳細:", err.message);
  }
}
run();