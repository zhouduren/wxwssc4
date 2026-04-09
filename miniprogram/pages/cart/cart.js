const { request } = require('../../utils/request');
const { requireUserLogin } = require('../../utils/auth');

Page({
  data: {
    list: [],
    total: 0,
    allChecked: false
  },
  async onShow() {
    if (!requireUserLogin()) return;
    await this.loadCart();
  },
  async loadCart() {
    const list = await request({ url: '/api/cart' });
    this.setData({ list }, this.calcTotal);
  },
  calcTotal() {
    const checkedItems = this.data.list.filter((i) => i.checked);
    const total = checkedItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const allChecked = this.data.list.length > 0 && this.data.list.every((i) => i.checked);
    this.setData({ total: Number(total.toFixed(2)), allChecked });
  },
  async toggleOne(e) {
    const item = e.currentTarget.dataset.item;
    await request({ url: '/api/cart', method: 'PUT', data: { itemId: item.id, checked: !item.checked } });
    this.loadCart();
  },
  async changeQty(e) {
    const { id, delta, quantity } = e.currentTarget.dataset;
    const next = Number(quantity) + Number(delta);
    if (next < 1) return;
    await request({ url: '/api/cart', method: 'PUT', data: { itemId: id, quantity: next } });
    this.loadCart();
  },
  async removeItem(e) {
    await request({ url: '/api/cart', method: 'DELETE', data: { itemIds: [e.currentTarget.dataset.id] } });
    this.loadCart();
  },
  async toggleAll() {
    const target = !this.data.allChecked;
    const tasks = this.data.list.map((item) =>
      request({ url: '/api/cart', method: 'PUT', data: { itemId: item.id, checked: target } })
    );
    await Promise.all(tasks);
    this.loadCart();
  },
  toConfirm() {
    const checked = this.data.list.filter((i) => i.checked);
    if (!checked.length) {
      wx.showToast({ title: '请先选择商品', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/order-confirm/order-confirm' });
  }
});
