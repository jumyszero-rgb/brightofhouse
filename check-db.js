// @/check-db.js
const { Client } = require('pg');

async function check() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ ERROR: DATABASE_URL が設定されていません。");
    return;
  }

  // パスワードを隠してURLを表示
  const masked = url.replace(/:([^:@]+)@/, ':****@');
  console.log(`📡 接続試行中: ${masked}`);

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000, // 5秒でタイムアウト
  });

  try {
    await client.connect();
    const res = await client.query('SELECT current_database(), now()');
    console.log("✅ 接続成功!");
    console.log(`   データベース名: ${res.rows[0].current_database}`);
    console.log(`   サーバー時刻: ${res.rows[0].now}`);
    await client.end();
  } catch (err) {
    console.error("❌ 接続失敗!");
    console.error(`   原因: ${err.message}`);
    if (err.code === 'ETIMEDOUT') {
      console.error("   ヒント: ネットワーク（ファイアウォール）で遮断されているか、URLが間違っています。");
    } else if (err.code === '28P01') {
      console.error("   ヒント: パスワードが間違っています。");
    }
  }
}

check();