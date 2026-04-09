const { request } = require('../../utils/request');
const { requireMerchantLogin, clearLogin } = require('../../utils/auth');

Page({
  data: {
    stats: null
  },
  async onShow() {
    if (!requireMerchantLogin()) return;
    const stats = await request({ url: '/api/admin/stats' });
    this.setData({ stats });
  },
  goProducts() {
    wx.navigateTo({ url: '/pages/merchant-products/merchant-products' });
  },
  goOrders() {
    wx.navigateTo({ url: '/pages/merchant-orders/merchant-orders' });
  },
  goStats() {
    wx.navigateTo({ url: '/pages/merchant-stats/merchant-stats' });
  },
  goService() {
    wx.navigateTo({ url: '/pages/merchant-service/merchant-service' });
  },
  logout() {
    clearLogin();
    wx.reLaunch({ url: '/pages/login/login' });
  }
});
