import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const accountId = process.env.R2_ACCOUNT_ID?.trim();
const bucketName = process.env.R2_BUCKET_NAME?.trim();
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
  console.log("バケットへの書き込みチェックを開始します...");
  try {
    const res = await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: "test-connection.txt",
      Body: "Connection OK",
      ContentType: "text/plain"
    }));
    console.log("✅ アップロード成功！通信および認証情報はすべて正常です。");
  } catch (err) {
    console.error("❌ アップロードエラー:");
    console.error("エラーコード:", err.name);
    console.error("エラー詳細:", err.message);
  }
}
run();