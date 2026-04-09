const { request } = require('../../utils/request');
const { requireUserLogin } = require('../../utils/auth');

Page({
  data: {
    list: [],
    content: ''
  },
  onShow() {
    if (!requireUserLogin()) return;
    this.loadList();
  },
  async loadList() {
    const list = await request({ url: '/api/messages' });
    this.setData({ list });
  },
  onInput(e) {
    this.setData({ content: e.detail.value });
  },
  async send() {
    if (!this.data.content) {
      wx.showToast({ title: '请输入消息', icon: 'none' });
      return;
    }
    await request({ url: '/api/messages', method: 'POST', data: { content: this.data.content } });
    this.setData({ content: '' });
    this.loadList();
  }
});
