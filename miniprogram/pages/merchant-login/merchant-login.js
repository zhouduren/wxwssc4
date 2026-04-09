const { request } = require('../../utils/request');
const { saveLogin, clearLogin } = require('../../utils/auth');

Page({
  data: {
    phone: '13800000000',
    password: '123456'
  },
  onInput(e) {
    this.setData({ [e.currentTarget.dataset.key]: e.detail.value });
  },
  async login() {
    clearLogin();
    const data = await request({
      url: '/api/auth/login',
      method: 'POST',
      auth: false,
      data: { phone: this.data.phone, password: this.data.password }
    });
    if (data.role !== 'merchant') {
      wx.showToast({ title: '请使用商家账号', icon: 'none' });
      return;
    }
    saveLogin(data);
    wx.redirectTo({ url: '/pages/merchant-dashboard/merchant-dashboard' });
  },
  backUser() {
    wx.navigateBack();
  }
});
