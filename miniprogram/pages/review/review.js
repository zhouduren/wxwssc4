const { request } = require('../../utils/request');
const { requireUserLogin } = require('../../utils/auth');

Page({
  data: {
    id: 0,
    detail: null,
    formMap: {}
  },
  onLoad(options) {
    this.setData({ id: Number(options.id || 0) });
  },
  async onShow() {
    if (!requireUserLogin()) return;
    const detail = await request({ url: `/api/orders/${this.data.id}` });
    const formMap = {};
    detail.items.forEach((item) => {
      formMap[item.productId] = { rating: 5, content: '', images: [] };
    });
    this.setData({ detail, formMap });
  },
  onRate(e) {
    const { productid, rating } = e.currentTarget.dataset;
    this.setData({ [`formMap.${productid}.rating`]: Number(rating) });
  },
  onInput(e) {
    const productid = e.currentTarget.dataset.productid;
    this.setData({ [`formMap.${productid}.content`]: e.detail.value });
  },
  async upload(e) {
    const productid = e.currentTarget.dataset.productid;
    const res = await new Promise((resolve, reject) => {
      wx.chooseImage({
        count: 9,
        success: resolve,
        fail: reject
      });
    });
    this.setData({ [`formMap.${productid}.images`]: res.tempFilePaths.slice(0, 9) });
  },
  async submit() {
    const { detail, formMap } = this.data;
    for (const item of detail.items) {
      const payload = formMap[item.productId];
      await request({
        url: '/api/reviews',
        method: 'POST',
        data: {
          orderId: detail.id,
          productId: item.productId,
          rating: payload.rating,
          content: payload.content,
          images: payload.images
        }
      });
    }
    wx.showToast({ title: '评价成功', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 500);
  }
});
