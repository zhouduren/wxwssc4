const { request } = require('../../utils/request');
const { requireMerchantLogin } = require('../../utils/auth');

Page({
  data: {
    id: 0,
    detail: null
  },
  onLoad(options) {
    this.setData({ id: Number(options.id || 0) });
  },
  async onShow() {
    if (!requireMerchantLogin()) return;
    const detail = await request({ url: `/api/admin/orders/${this.data.id}` });
    this.setData({ detail });
  },
  async nextStatus() {
    const { detail } = this.data;
    const status = detail.status === '待配送' ? '配送中' : detail.status === '配送中' ? '已完成' : '';
    if (!status) return;
    await request({ url: `/api/admin/orders/${detail.id}/status`, method: 'PUT', data: { status } });
    const latest = await request({ url: `/api/admin/orders/${detail.id}` });
    this.setData({ detail: latest });
  }
});
