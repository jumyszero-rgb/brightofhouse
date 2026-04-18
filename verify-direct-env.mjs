import { S3Client, PutObjectCommand, ListBucketsCommand } from "@aws-sdk/client-s3";
import fs from "fs";

// .envファイルを直接パースする関数
function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const env = {};
  content.split("\n").forEach(line => {
    // # で始まる行は無視
    if (line.trim().startsWith("#")) return;
    
    // key=value の形式で分割
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || "";
      
      // # の後のコメントを削除 (値の途中にある場合は考慮しない簡易版)
      value = value.split(" #")[0].trim();
      
      // 前後のクォーテーションを削除
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      
      env[key] = value;
    }
  });
  return env;
}

const env = parseEnvFile(".env");

const accountId = env.R2_ACCOUNT_ID;
const bucketName = env.R2_BUCKET_NAME;
const accessKeyId = env.R2_ACCESS_KEY_ID;
const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

console.log("Using credentials from .env:");
console.log("Account ID:", accountId ? accountId.substring(0, 5) + "..." : "Missing");
console.log("Bucket Name:", bucketName);
console.log("Access Key ID:", accessKeyId ? accessKeyId.substring(0, 5) + "..." : "Missing");

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
  console.log("\n接続テストを開始します...");
  try {
    const res = await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: "final-test.txt",
      Body: "It works!",
      ContentType: "text/plain"
    }));
    console.log("✅ 接続およびアップロード成功！");
  } catch (err) {
    console.error("❌ エラー発生:", err.name, err.message);
  }
}

run();