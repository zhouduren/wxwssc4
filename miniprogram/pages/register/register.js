const { request } = require('../../utils/request');

Page({
  data: {
    phone: '',
    password: '',
    nickname: '',
    dormBuilding: '',
    dormRoom: ''
  },
  onInput(e) {
    this.setData({ [e.currentTarget.dataset.key]: e.detail.value });
  },
  async submitRegister() {
    const { phone, password, nickname, dormBuilding, dormRoom } = this.data;
    if (!phone || !password || !nickname || !dormBuilding || !dormRoom) {
      wx.showToast({ title: '请完整填写信息', icon: 'none' });
      return;
    }
    try {
      await request({
        url: '/api/auth/register',
        method: 'POST',
        auth: false,
        data: { phone, password, nickname, dormBuilding, dormRoom }
      });
      wx.showToast({ title: '注册成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (error) {}
  }
});
