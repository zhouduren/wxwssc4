const express = require('express');
const pool = require('../config/db');
const { ok, fail } = require('../utils/http');

const router = express.Router();

router.get('/products', async (req, res, next) => {
  try {
    const { category, keyword } = req.query;
    const where = ['status = 1'];
    const params = [];
    if (category) {
      where.push('category = ?');
      params.push(category);
    }
    if (keyword) {
      where.push('name LIKE ?');
      params.push(`%${keyword}%`);
    }
    const [rows] = await pool.query(
      `SELECT id, name, category, price, stock, sales, image_url AS imageUrl, detail_html AS detailHtml, status
       FROM product WHERE ${where.join(' AND ')} ORDER BY id DESC`,
      params
    );
    return ok(res, rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, category, price, stock, sales, image_url AS imageUrl, detail_html AS detailHtml, status FROM product WHERE id = ? LIMIT 1',
      [req.params.id]
    );
    if (!rows.length || rows[0].status !== 1) {
      return fail(res, '商品不存在', 404);
    }
    return ok(res, rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.get('/categories', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT DISTINCT category FROM product WHERE status = 1 AND category IS NOT NULL AND category <> ''"
    );
    return ok(res, rows.map((item) => item.category));
  } catch (error) {
    return next(error);
  }
});

router.get('/products/:id/reviews', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.rating, r.content, r.images, r.created_at AS createdAt, u.nickname
       FROM review r
       LEFT JOIN \`user\` u ON u.id = r.user_id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    const result = rows.map((item) => ({ ...item, images: item.images ? JSON.parse(item.images) : [] }));
    return ok(res, result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
