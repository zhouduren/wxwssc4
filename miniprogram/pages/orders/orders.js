const { request } = require('../../utils/request');
const { requireUserLogin } = require('../../utils/auth');

Page({
  data: {
    tabs: ['全部', '待支付', '待配送', '配送中', '已完成', '已取消'],
    active: '全部',
    list: []
  },
  onShow() {
    if (!requireUserLogin()) return;
    this.loadOrders();
  },
  async loadOrders() {
    const status = this.data.active === '全部' ? '' : this.data.active;
    const list = await request({ url: `/api/orders${status ? `?status=${encodeURIComponent(status)}` : ''}` });
    this.setData({ list });
  },
  switchTab(e) {
    this.setData({ active: e.currentTarget.dataset.tab }, () => this.loadOrders());
  },
  toDetail(e) {
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${e.currentTarget.dataset.id}` });
  },
  async pay(e) {
    await request({ url: `/api/orders/${e.currentTarget.dataset.id}/pay`, method: 'PUT' });
    this.loadOrders();
  },
  async cancel(e) {
    await request({ url: `/api/orders/${e.currentTarget.dataset.id}/cancel`, method: 'PUT' });
    this.loadOrders();
  },
  review(e) {
    wx.navigateTo({ url: `/pages/review/review?id=${e.currentTarget.dataset.id}` });
  }
});
