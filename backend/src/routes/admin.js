const express = require('express');
const pool = require('../config/db');
const { ok, fail } = require('../utils/http');

const router = express.Router();

router.get('/products', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, category, price, stock, sales, image_url AS imageUrl, detail_html AS detailHtml, status FROM product ORDER BY id DESC'
    );
    return ok(res, rows);
  } catch (error) {
    return next(error);
  }
});

router.post('/products', async (req, res, next) => {
  try {
    const { name, category, price, stock, imageUrl, detailHtml = '', status = 1 } = req.body;
    if (!name || !category || price === undefined || stock === undefined || !imageUrl) {
      return fail(res, '参数缺失');
    }
    await pool.query(
      `INSERT INTO product (name, category, price, stock, sales, image_url, detail_html, status)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
      [name, category, Number(price), Number(stock), imageUrl, detailHtml, Number(status) ? 1 : 0]
    );
    return ok(res, null, '新增成功');
  } catch (error) {
    return next(error);
  }
});

router.put('/products/:id', async (req, res, next) => {
  try {
    const { name, category, price, stock, imageUrl, detailHtml, status } = req.body;
    const fields = [];
    const params = [];
    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }
    if (category !== undefined) {
      fields.push('category = ?');
      params.push(category);
    }
    if (price !== undefined) {
      fields.push('price = ?');
      params.push(Number(price));
    }
    if (stock !== undefined) {
      fields.push('stock = ?');
      params.push(Number(stock));
    }
    if (imageUrl !== undefined) {
      fields.push('image_url = ?');
      params.push(imageUrl);
    }
    if (detailHtml !== undefined) {
      fields.push('detail_html = ?');
      params.push(detailHtml);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      params.push(Number(status) ? 1 : 0);
    }
    if (!fields.length) {
      return fail(res, '无可更新字段');
    }
    params.push(req.params.id);
    await pool.query(`UPDATE product SET ${fields.join(', ')} WHERE id = ?`, params);
    return ok(res, null, '更新成功');
  } catch (error) {
    return next(error);
  }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM product WHERE id = ?', [req.params.id]);
    return ok(res, null, '删除成功');
  } catch (error) {
    return next(error);
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = [];
    const params = [];
    if (status) {
      where.push('o.status = ?');
      params.push(status);
    }
    const sqlWhere = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT o.id, o.order_no AS orderNo, o.total_amount AS totalAmount, o.paid_amount AS paidAmount, o.status,
       o.delivery_address AS deliveryAddress, o.contact_name AS contactName, o.contact_phone AS contactPhone, o.created_at AS createdAt,
       u.nickname, u.phone
       FROM \`order\` o
       LEFT JOIN \`user\` u ON u.id = o.user_id
       ${sqlWhere}
       ORDER BY o.id DESC`,
      params
    );
    return ok(res, rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.id, o.order_no AS orderNo, o.total_amount AS totalAmount, o.paid_amount AS paidAmount, o.status,
       o.user_remark AS userRemark, o.delivery_time AS deliveryTime, o.delivery_address AS deliveryAddress,
       o.contact_name AS contactName, o.contact_phone AS contactPhone, o.created_at AS createdAt, o.paid_at AS paidAt,
       o.delivery_started_at AS deliveryStartedAt, o.delivered_at AS deliveredAt, u.nickname, u.phone
       FROM \`order\` o
       LEFT JOIN \`user\` u ON u.id = o.user_id
       WHERE o.id = ? LIMIT 1`,
      [req.params.id]
    );
    if (!rows.length) {
      return fail(res, '订单不存在', 404);
    }
    const [items] = await pool.query(
      `SELECT id, product_id AS productId, product_name AS productName, unit_price AS unitPrice, quantity, subtotal
       FROM order_item WHERE order_id = ?`,
      [req.params.id]
    );
    return ok(res, { ...rows[0], items });
  } catch (error) {
    return next(error);
  }
});

router.put('/orders/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['配送中', '已完成'].includes(status)) {
      return fail(res, '状态不支持');
    }
    const [rows] = await pool.query('SELECT id, status FROM `order` WHERE id = ? LIMIT 1', [req.params.id]);
    if (!rows.length) {
      return fail(res, '订单不存在', 404);
    }
    const current = rows[0].status;
    if (status === '配送中' && current !== '待配送') {
      return fail(res, '当前状态不可改为配送中');
    }
    if (status === '已完成' && current !== '配送中') {
      return fail(res, '当前状态不可改为已完成');
    }
    if (status === '配送中') {
      await pool.query("UPDATE `order` SET status = '配送中', delivery_started_at = NOW() WHERE id = ?", [req.params.id]);
    } else {
      await pool.query("UPDATE `order` SET status = '已完成', delivered_at = NOW() WHERE id = ?", [req.params.id]);
      const [items] = await pool.query('SELECT product_id, quantity FROM order_item WHERE order_id = ?', [req.params.id]);
      for (const item of items) {
        await pool.query('UPDATE product SET sales = sales + ?, stock = stock - ? WHERE id = ?', [
          item.quantity,
          item.quantity,
          item.product_id
        ]);
      }
    }
    return ok(res, null, '状态更新成功');
  } catch (error) {
    return next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const [todayIncomeRows] = await pool.query(
      "SELECT IFNULL(SUM(paid_amount),0) AS todayIncome FROM `order` WHERE status IN ('待配送','配送中','已完成') AND DATE(paid_at) = CURDATE()"
    );
    const [todayOrderRows] = await pool.query(
      "SELECT COUNT(1) AS todayOrders FROM `order` WHERE DATE(created_at) = CURDATE()"
    );
    const [totalProductRows] = await pool.query('SELECT COUNT(1) AS totalProducts FROM product');
    const [lowStockRows] = await pool.query(
      'SELECT id, name, stock FROM product WHERE stock <= 5 ORDER BY stock ASC, id DESC LIMIT 10'
    );
    const [hotRows] = await pool.query(
      'SELECT id, name, sales, price FROM product ORDER BY sales DESC, id DESC LIMIT 5'
    );
    const [categoryRows] = await pool.query(
      `SELECT p.category, IFNULL(SUM(CASE WHEN o.id IS NOT NULL THEN oi.quantity ELSE 0 END),0) AS salesCount
       FROM product p
       LEFT JOIN order_item oi ON oi.product_id = p.id
       LEFT JOIN \`order\` o ON o.id = oi.order_id AND o.status = '已完成'
       GROUP BY p.category`
    );
    const [trendRows] = await pool.query(
      `SELECT DATE_FORMAT(paid_at, '%Y-%m-%d') AS day, IFNULL(SUM(paid_amount),0) AS amount
       FROM \`order\`
       WHERE paid_at IS NOT NULL AND paid_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       AND status IN ('待配送','配送中','已完成')
       GROUP BY DATE_FORMAT(paid_at, '%Y-%m-%d')
       ORDER BY day ASC`
    );
    return ok(res, {
      todayIncome: Number(todayIncomeRows[0].todayIncome),
      todayOrders: Number(todayOrderRows[0].todayOrders),
      totalProducts: Number(totalProductRows[0].totalProducts),
      lowStockProducts: lowStockRows,
      hotProducts: hotRows,
      categorySales: categoryRows,
      salesTrend: trendRows
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/messages', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.user_id AS userId, m.content, m.reply, m.status, m.created_at AS createdAt, u.nickname, u.phone
       FROM service_message m
       LEFT JOIN \`user\` u ON u.id = m.user_id
       ORDER BY (m.status = '待回复') DESC, m.id DESC`
    );
    return ok(res, rows);
  } catch (error) {
    return next(error);
  }
});

router.post('/messages/:id/reply', async (req, res, next) => {
  try {
    const { reply } = req.body;
    if (!reply) {
      return fail(res, '回复内容不能为空');
    }
    await pool.query("UPDATE service_message SET reply = ?, status = '已回复' WHERE id = ?", [reply, req.params.id]);
    return ok(res, null, '回复成功');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
