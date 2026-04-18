import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const accountId = process.env.R2_ACCOUNT_ID?.trim();
const bucketName = process.env.R2_BUCKET_NAME?.trim();
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();

console.log({
  accountId: accountId ? accountId.length : null,
  bucketName,
  accessKeyId: accessKeyId ? accessKeyId.length : null,
  secretAccessKey: secretAccessKey ? secretAccessKey.length : null,
});

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  });

async function run() {
  try {
    const res = await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: "test-upload.txt",
      Body: "Hello R2",
      ContentType: "text/plain"
    }));
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err.name, err.message);
  }
}
run();
