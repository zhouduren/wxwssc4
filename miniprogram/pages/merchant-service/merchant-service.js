const { request } = require('../../utils/request');
const { requireMerchantLogin } = require('../../utils/auth');

Page({
  data: {
    list: [],
    replyMap: {}
  },
  onShow() {
    if (!requireMerchantLogin()) return;
    this.loadList();
  },
  async loadList() {
    const list = await request({ url: '/api/admin/messages' });
    this.setData({ list });
  },
  onInput(e) {
    this.setData({ [`replyMap.${e.currentTarget.dataset.id}`]: e.detail.value });
  },
  async submit(e) {
    const id = e.currentTarget.dataset.id;
    const reply = this.data.replyMap[id];
    if (!reply) {
      wx.showToast({ title: '请输入回复内容', icon: 'none' });
      return;
    }
    await request({ url: `/api/admin/messages/${id}/reply`, method: 'POST', data: { reply } });
    this.loadList();
  }
});
