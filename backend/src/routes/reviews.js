const express = require('express');
const pool = require('../config/db');
const { ok, fail } = require('../utils/http');

const router = express.Router();

router.post('/reviews', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderId, productId, rating, content = '', images = [] } = req.body;
    if (!orderId || !productId || !rating) {
      return fail(res, '参数缺失');
    }
    if (Number(rating) < 1 || Number(rating) > 5) {
      return fail(res, '评分范围错误');
    }
    if (Array.isArray(images) && images.length > 9) {
      return fail(res, '最多上传9张图片');
    }
    const [orderRows] = await pool.query('SELECT status FROM `order` WHERE id = ? AND user_id = ? LIMIT 1', [orderId, userId]);
    if (!orderRows.length) {
      return fail(res, '订单不存在', 404);
    }
    if (orderRows[0].status !== '已完成') {
      return fail(res, '仅已完成订单可评价');
    }
    const [itemRows] = await pool.query(
      'SELECT id FROM order_item WHERE order_id = ? AND product_id = ? LIMIT 1',
      [orderId, productId]
    );
    if (!itemRows.length) {
      return fail(res, '订单中不存在该商品');
    }
    const [exists] = await pool.query('SELECT id FROM review WHERE order_id = ? AND user_id = ? AND product_id = ? LIMIT 1', [
      orderId,
      userId,
      productId
    ]);
    if (exists.length) {
      return fail(res, '该商品已评价');
    }
    await pool.query(
      'INSERT INTO review (order_id, user_id, product_id, rating, content, images) VALUES (?, ?, ?, ?, ?, ?)',
      [orderId, userId, productId, Number(rating), content, JSON.stringify(images || [])]
    );
    return ok(res, null, '评价成功');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
