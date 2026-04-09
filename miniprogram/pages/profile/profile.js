const app = getApp();
const { clearLogin, requireUserLogin } = require('../../utils/auth');

Page({
  data: {
    userInfo: null
  },
  onShow() {
    if (!requireUserLogin()) return;
    this.setData({ userInfo: app.globalData.userInfo });
  },
  goOrders() {
    wx.switchTab({ url: '/pages/orders/orders' });
  },
  goService() {
    wx.navigateTo({ url: '/pages/service/service' });
  },
  logout() {
    clearLogin();
    wx.reLaunch({ url: '/pages/login/login' });
  }
});
