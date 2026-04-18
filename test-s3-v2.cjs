const AWS = require("aws-sdk");
require("dotenv").config();

const accountId = process.env.R2_ACCOUNT_ID.trim();
const accessKeyId = process.env.R2_ACCESS_KEY_ID.trim();
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY.trim();
const bucketName = process.env.R2_BUCKET_NAME.trim();

const s3 = new AWS.S3({
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
  signatureVersion: 'v4',
  s3ForcePathStyle: true,
  region: 'auto'
});

s3.putObject({
  Bucket: bucketName,
  Key: "test-upload-v2.txt",
  Body: "Hello R2 from v2",
  ContentType: "text/plain"
}, (err, data) => {
  if (err) console.error("Error:", err.code, err.message);
  else console.log("Success:", data);
});
