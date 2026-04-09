const { request } = require('../../utils/request');
const { saveLogin } = require('../../utils/auth');

Page({
  data: {
    phone: '',
    password: ''
  },
  onInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [key]: e.detail.value });
  },
  async handleLogin() {
    const { phone, password } = this.data;
    if (!phone || !password) {
      wx.showToast({ title: '请输入账号密码', icon: 'none' });
      return;
    }
    try {
      const data = await request({
        url: '/api/auth/login',
        method: 'POST',
        auth: false,
        data: { phone, password }
      });
      if (data.role !== 'user') {
        wx.showToast({ title: '请使用用户账号登录', icon: 'none' });
        return;
      }
      saveLogin(data);
      wx.switchTab({ url: '/pages/category/category' });
    } catch (error) {}
  },
  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  },
  goMerchant() {
    wx.navigateTo({ url: '/pages/merchant-login/merchant-login' });
  }
});
