const app = getApp();
const { request } = require('../../utils/request');
const { requireUserLogin } = require('../../utils/auth');

Page({
  data: {
    userInfo: null,
    cartList: [],
    total: 0,
    deliveryTime: '尽快送达',
    remark: '',
    contactName: '',
    contactPhone: ''
  },
  async onShow() {
    if (!requireUserLogin()) return;
    const userInfo = app.globalData.userInfo || {};
    const cartList = (await request({ url: '/api/cart' })).filter((item) => item.checked);
    const total = cartList.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    this.setData({
      userInfo,
      cartList,
      total: Number(total.toFixed(2)),
      contactName: userInfo.nickname || '',
      contactPhone: userInfo.phone || ''
    });
  },
  onInput(e) {
    this.setData({ [e.currentTarget.dataset.key]: e.detail.value });
  },
  async submitOrder() {
    const { deliveryTime, remark, contactName, contactPhone } = this.data;
    if (!contactName || !contactPhone) {
      wx.showToast({ title: '请填写联系人信息', icon: 'none' });
      return;
    }
    const data = await request({
      url: '/api/orders',
      method: 'POST',
      data: { deliveryTime, remark, contactName, contactPhone }
    });
    wx.showToast({ title: '下单成功', icon: 'success' });
    setTimeout(() => wx.redirectTo({ url: `/pages/order-detail/order-detail?id=${data.orderId}` }), 500);
  }
});
