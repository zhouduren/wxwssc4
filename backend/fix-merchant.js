require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // 把 admin 账号的 phone 改成正常手机号，并重置密码
  const hash = await bcrypt.hash('123456', 10);
  await conn.query(
    "UPDATE `user` SET phone = '13800000000', password = ? WHERE id = 1",
    [hash]
  );
  console.log('商家账号已更新！');
  console.log('手机号: 13800000000');
  console.log('密码: 123456');

  await conn.end();
}

main().catch(e => console.error('Error:', e.message));
