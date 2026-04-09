const express = require('express');
const pool = require('../config/db');
const { ok, fail } = require('../utils/http');

const router = express.Router();

function buildOrderNo() {
  return `OD${Date.now()}${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`;
}

router.post('/orders', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const userId = req.user.id;
    const { remark = '', deliveryTime = '尽快送达', contactName, contactPhone } = req.body;
    if (!contactName || !contactPhone) {
      conn.release();
      return fail(res, '参数缺失');
    }
    await conn.beginTransaction();
    const [userRows] = await conn.query(
      'SELECT dorm_building, dorm_room, nickname, phone FROM `user` WHERE id = ? LIMIT 1',
      [userId]
    );
    const user = userRows[0];
    const address = `${user.dorm_building}${user.dorm_room}`;
    const [cartItems] = await conn.query(
      `SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.stock, p.status
       FROM cart c JOIN product p ON p.id = c.product_id
       WHERE c.user_id = ? AND c.checked = 1`,
      [userId]
    );
    if (!cartItems.length) {
      await conn.rollback();
      conn.release();
      return fail(res, '未选择结算商品');
    }
    let totalAmount = 0;
    for (const item of cartItems) {
      if (item.status !== 1 || item.stock < item.quantity) {
        await conn.rollback();
        conn.release();
        return fail(res, `商品库存不足: ${item.name}`);
      }
      totalAmount += Number(item.price) * Number(item.quantity);
    }
    const orderNo = buildOrderNo();
    const [orderResult] = await conn.query(
      `INSERT INTO \`order\` 
       (order_no, user_id, total_amount, paid_amount, status, user_remark, delivery_time, delivery_address, contact_name, contact_phone)
       VALUES (?, ?, ?, ?, '待支付', ?, ?, ?, ?, ?)`,
      [orderNo, userId, totalAmount, totalAmount, remark, deliveryTime, address, contactName, contactPhone]
    );
    for (const item of cartItems) {
      const subtotal = Number(item.price) * Number(item.quantity);
      await conn.query(
        `INSERT INTO order_item (order_id, product_id, product_name, unit_price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderResult.insertId, item.product_id, item.name, item.price, item.quantity, subtotal]
      );
    }
    await conn.query(`DELETE FROM cart WHERE id IN (${cartItems.map(() => '?').join(',')})`, cartItems.map((item) => item.id));
    await conn.commit();
    conn.release();
    return ok(res, { orderId: orderResult.insertId, orderNo }, '下单成功');
  } catch (error) {
    await conn.rollback();
    conn.release();
    return next(error);
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = ['user_id = ?'];
    const params = [req.user.id];
    if (status) {
      where.push('status = ?');
      params.push(status);
    }
    const [rows] = await pool.query(
      `SELECT id, order_no AS orderNo, total_amount AS totalAmount, paid_amount AS paidAmount, status, created_at AS createdAt
       FROM \`order\`
       WHERE ${where.join(' AND ')}
       ORDER BY id DESC`,
      params
    );
    return ok(res, rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const [orderRows] = await pool.query(
      `SELECT id, order_no AS orderNo, user_id AS userId, total_amount AS totalAmount, paid_amount AS paidAmount, status, user_remark AS userRemark,
       delivery_time AS deliveryTime, delivery_address AS deliveryAddress, contact_name AS contactName, contact_phone AS contactPhone,
       created_at AS createdAt, paid_at AS paidAt, delivery_started_at AS deliveryStartedAt, delivered_at AS deliveredAt
       FROM \`order\` WHERE id = ? AND user_id = ? LIMIT 1`,
      [req.params.id, req.user.id]
    );
    if (!orderRows.length) {
      return fail(res, '订单不存在', 404);
    }
    const [items] = await pool.query(
      `SELECT id, product_id AS productId, product_name AS productName, unit_price AS unitPrice, quantity, subtotal
       FROM order_item WHERE order_id = ?`,
      [req.params.id]
    );
    return ok(res, { ...orderRows[0], items });
  } catch (error) {
    return next(error);
  }
});

router.put('/orders/:id/pay', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, status FROM `order` WHERE id = ? AND user_id = ? LIMIT 1', [
      req.params.id,
      req.user.id
    ]);
    if (!rows.length) {
      return fail(res, '订单不存在', 404);
    }
    if (rows[0].status !== '待支付') {
      return fail(res, '当前状态不可支付');
    }
    await pool.query("UPDATE `order` SET status = '待配送', paid_at = NOW() WHERE id = ?", [req.params.id]);
    return ok(res, null, '支付成功');
  } catch (error) {
    return next(error);
  }
});

router.put('/orders/:id/cancel', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, status FROM `order` WHERE id = ? AND user_id = ? LIMIT 1', [
      req.params.id,
      req.user.id
    ]);
    if (!rows.length) {
      return fail(res, '订单不存在', 404);
    }
    if (rows[0].status !== '待支付') {
      return fail(res, '当前状态不可取消');
    }
    await pool.query("UPDATE `order` SET status = '已取消' WHERE id = ?", [req.params.id]);
    return ok(res, null, '取消成功');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
