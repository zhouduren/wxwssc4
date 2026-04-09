const express = require('express');
const pool = require('../config/db');
const { ok, fail } = require('../utils/http');

const router = express.Router();

router.post('/messages', async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) {
      return fail(res, '消息不能为空');
    }
    await pool.query('INSERT INTO service_message (user_id, content, status) VALUES (?, ?, ?)', [
      req.user.id,
      content,
      '待回复'
    ]);
    return ok(res, null, '发送成功');
  } catch (error) {
    return next(error);
  }
});

router.get('/messages', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, user_id AS userId, content, reply, status, created_at AS createdAt
       FROM service_message WHERE user_id = ? ORDER BY id DESC`,
      [req.user.id]
    );
    return ok(res, rows);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
