const { request } = require('../../utils/request');
const { requireMerchantLogin } = require('../../utils/auth');

Page({
  data: {
    tabs: ['全部', '待支付', '待配送', '配送中', '已完成', '已取消'],
    active: '全部',
    list: []
  },
  onShow() {
    if (!requireMerchantLogin()) return;
    this.loadList();
  },
  async loadList() {
    const status = this.data.active === '全部' ? '' : this.data.active;
    const list = await request({ url: `/api/admin/orders${status ? `?status=${encodeURIComponent(status)}` : ''}` });
    this.setData({ list });
  },
  switchTab(e) {
    this.setData({ active: e.currentTarget.dataset.tab }, () => this.loadList());
  },
  toDetail(e) {
    wx.navigateTo({ url: `/pages/merchant-order-detail/merchant-order-detail?id=${e.currentTarget.dataset.id}` });
  },
  async nextStatus(e) {
    const item = e.currentTarget.dataset.item;
    const target = item.status === '待配送' ? '配送中' : item.status === '配送中' ? '已完成' : '';
    if (!target) return;
    await request({ url: `/api/admin/orders/${item.id}/status`, method: 'PUT', data: { status: target } });
    this.loadList();
  }
});
