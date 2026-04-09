const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { ok, fail } = require('../utils/http');
const { signToken } = require('../utils/jwt');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { phone, password, nickname, dormBuilding, dormRoom } = req.body;
    if (!phone || !password || !nickname || !dormBuilding || !dormRoom) {
      return fail(res, '参数缺失');
    }
    const [exists] = await pool.query('SELECT id FROM `user` WHERE phone = ?', [phone]);
    if (exists.length) {
      return fail(res, '手机号已注册');
    }
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO `user` (phone, password, nickname, dorm_building, dorm_room, role) VALUES (?, ?, ?, ?, ?, ?)',
      [phone, hash, nickname, dormBuilding, dormRoom, 'user']
    );
    return ok(res, null, '注册成功');
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return fail(res, '参数缺失');
    }
    const [rows] = await pool.query(
      'SELECT id, phone, password, nickname, dorm_building, dorm_room, role FROM `user` WHERE phone = ? LIMIT 1',
      [phone]
    );
    if (!rows.length) {
      return fail(res, '账号或密码错误', 401);
    }
    const user = rows[0];
    const pass = await bcrypt.compare(password, user.password);
    if (!pass) {
      return fail(res, '账号或密码错误', 401);
    }
    const token = signToken({ id: user.id, role: user.role, phone: user.phone, nickname: user.nickname });
    return ok(res, {
      token,
      role: user.role,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        dormBuilding: user.dorm_building,
        dormRoom: user.dorm_room
      }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
