const { request } = require('../../utils/request');
const { requireUserLogin } = require('../../utils/auth');

Page({
  data: {
    id: 0,
    product: null,
    quantity: 1,
    reviews: []
  },
  async onLoad(options) {
    this.setData({ id: Number(options.id || 0) });
  },
  async onShow() {
    if (!requireUserLogin()) return;
    await this.loadDetail();
  },
  async loadDetail() {
    const { id } = this.data;
    const [product, reviews] = await Promise.all([
      request({ url: `/api/products/${id}` }),
      request({ url: `/api/products/${id}/reviews` })
    ]);
    this.setData({ product, reviews });
    wx.setNavigationBarTitle({ title: product.name });
  },
  stepMinus() {
    const quantity = Math.max(1, this.data.quantity - 1);
    this.setData({ quantity });
  },
  stepPlus() {
    const quantity = this.data.quantity + 1;
    this.setData({ quantity });
  },
  async addToCart() {
    await request({
      url: '/api/cart',
      method: 'POST',
      data: { productId: this.data.id, quantity: this.data.quantity }
    });
    wx.showToast({ title: '已加入购物车', icon: 'success' });
  },
  buyNow() {
    wx.navigateTo({ url: '/pages/cart/cart?buyNow=1' });
  }
});
