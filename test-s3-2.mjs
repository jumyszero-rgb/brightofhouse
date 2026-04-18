import dotenv from "dotenv";
dotenv.config();

console.log("Secret Access Key prefix:", process.env.R2_SECRET_ACCESS_KEY ? process.env.R2_SECRET_ACCESS_KEY.substring(0, 10) : "MISSING");
console.log("Access Key ID prefix:", process.env.R2_ACCESS_KEY_ID ? process.env.R2_ACCESS_KEY_ID.substring(0, 10) : "MISSING");
