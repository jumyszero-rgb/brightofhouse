// @/check-db.js
const { Client } = require('pg');
require('dotenv').config();

async function testConnection(label, connectionString) {
  console.log(`\n--- Testing ${label} ---`);
  
  if (!connectionString) {
    console.log(`❌ ${label} is not set in .env`);
    return;
  }

  // パスワードを隠してURLを表示
  const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':****@');
  console.log(`URL: ${maskedUrl}`);

  const client = new Client({
    connectionString: connectionString,
    // Supabase接続にはSSL設定が必須
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const res = await client.query('SELECT NOW() as now, current_user as user, current_database() as db');
    console.log(`✅ Connection SUCCESS!`);
    console.log(`   Time: ${res.rows[0].now}`);
    console.log(`   User: ${res.rows[0].user}`);
    console.log(`   DB  : ${res.rows[0].db}`);
    await client.end();
  } catch (err) {
    console.error(`❌ Connection FAILED`);
    console.error(`   Error: ${err.message}`);
    if (err.code) console.error(`   Code: ${err.code}`);
    // 認証エラーの場合のヒント
    if (err.code === '28P01') {
      console.error(`   Hint: パスワードが間違っているか、ユーザー名にプロジェクトIDが含まれていない可能性があります。`);
    }
  }
}

(async () => {
  console.log("Starting DB Connection Check...");
  await testConnection('DATABASE_URL', process.env.DATABASE_URL);
  if (process.env.DIRECT_URL) {
    await testConnection('DIRECT_URL', process.env.DIRECT_URL);
  }
})();