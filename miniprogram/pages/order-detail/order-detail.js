const { request } = require('../../utils/request');
const { requireUserLogin } = require('../../utils/auth');

Page({
  data: {
    id: 0,
    detail: null
  },
  onLoad(options) {
    this.setData({ id: Number(options.id || 0) });
  },
  async onShow() {
    if (!requireUserLogin()) return;
    const detail = await request({ url: `/api/orders/${this.data.id}` });
    this.setData({ detail });
  }
});
