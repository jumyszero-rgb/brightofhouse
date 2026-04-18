// @/src/lib/s3.ts
import { S3Client } from "@aws-sdk/client-s3";

const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
const accountId = process.env.R2_ACCOUNT_ID?.trim();

if (!accessKeyId || !secretAccessKey || !accountId) {
  console.error("R2 configuration is missing or empty in environment variables!");
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
  // R2ではパススタイルを強制することで、署名の不整合（SignatureDoesNotMatch）を防ぎます
  forcePathStyle: true,
});