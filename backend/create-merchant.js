require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // 查看现有用户
  const [users] = await conn.query('SELECT id, phone, nickname, role FROM `user`');
  console.log('=== 现有用户 ===');
  console.log(JSON.stringify(users, null, 2));

  // 检查是否有商家账号
  const [merchants] = await conn.query("SELECT id, phone, nickname, role FROM `user` WHERE role = 'merchant'");
  if (merchants.length === 0) {
    console.log('\n=== 没有商家账号，正在创建 ===');
    // 创建商家测试账号
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('888888', 10);
    await conn.query(
      "INSERT INTO `user` (phone, password, nickname, role) VALUES (?, ?, ?, ?)",
      ['13800000000', hash, '测试商家', 'merchant']
    );
    console.log('商家账号创建成功！');
    console.log('手机号: 13800000000');
    console.log('密码: 888888');
  } else {
    console.log('\n=== 已有商家账号 ===');
    console.log(JSON.stringify(merchants, null, 2));
  }

  await conn.end();
}

main().catch(e => console.error('Error:', e.message));
