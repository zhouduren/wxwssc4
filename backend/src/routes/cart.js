const express = require('express');
const pool = require('../config/db');
const { ok, fail } = require('../utils/http');

const router = express.Router();

router.post('/cart', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;
    if (!productId || Number(quantity) < 1) {
      return fail(res, '参数错误');
    }
    const [products] = await pool.query('SELECT id, stock, status FROM product WHERE id = ? LIMIT 1', [productId]);
    if (!products.length || products[0].status !== 1) {
      return fail(res, '商品不可购买');
    }
    const [rows] = await pool.query('SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? LIMIT 1', [userId, productId]);
    if (rows.length) {
      const nextQty = rows[0].quantity + Number(quantity);
      if (nextQty > products[0].stock) {
        return fail(res, '库存不足');
      }
      await pool.query('UPDATE cart SET quantity = ? WHERE id = ?', [nextQty, rows[0].id]);
    } else {
      if (Number(quantity) > products[0].stock) {
        return fail(res, '库存不足');
      }
      await pool.query('INSERT INTO cart (user_id, product_id, quantity, checked) VALUES (?, ?, ?, 1)', [
        userId,
        productId,
        Number(quantity)
      ]);
    }
    return ok(res, null, '加入购物车成功');
  } catch (error) {
    return next(error);
  }
});

router.get('/cart', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.product_id AS productId, c.quantity, c.checked, p.name, p.price, p.stock, p.image_url AS imageUrl
       FROM cart c
       JOIN product p ON p.id = c.product_id
       WHERE c.user_id = ?
       ORDER BY c.id DESC`,
      [req.user.id]
    );
    return ok(res, rows);
  } catch (error) {
    return next(error);
  }
});

router.put('/cart', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId, quantity, checked } = req.body;
    if (!itemId) {
      return fail(res, '参数缺失');
    }
    const [rows] = await pool.query(
      `SELECT c.id, c.product_id, p.stock
       FROM cart c JOIN product p ON p.id = c.product_id
       WHERE c.id = ? AND c.user_id = ? LIMIT 1`,
      [itemId, userId]
    );
    if (!rows.length) {
      return fail(res, '购物车项不存在', 404);
    }
    if (quantity !== undefined) {
      if (Number(quantity) < 1 || Number(quantity) > rows[0].stock) {
        return fail(res, '数量不合法');
      }
      await pool.query('UPDATE cart SET quantity = ? WHERE id = ?', [Number(quantity), itemId]);
    }
    if (checked !== undefined) {
      await pool.query('UPDATE cart SET checked = ? WHERE id = ?', [checked ? 1 : 0, itemId]);
    }
    return ok(res, null, '更新成功');
  } catch (error) {
    return next(error);
  }
});

router.delete('/cart', async (req, res, next) => {
  try {
    const { itemIds = [] } = req.body;
    if (!Array.isArray(itemIds) || !itemIds.length) {
      return fail(res, '参数缺失');
    }
    await pool.query(`DELETE FROM cart WHERE user_id = ? AND id IN (${itemIds.map(() => '?').join(',')})`, [
      req.user.id,
      ...itemIds
    ]);
    return ok(res, null, '删除成功');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
