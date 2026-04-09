const { request } = require('../../utils/request');
const { requireMerchantLogin } = require('../../utils/auth');

const defaultForm = {
  id: 0,
  name: '',
  category: '零食',
  price: '',
  stock: '',
  imageUrl: '',
  detailHtml: '',
  status: 1
};

Page({
  data: {
    list: [],
    form: { ...defaultForm },
    editing: false,
    categories: ['零食', '饮料', '速食', '其他']
  },
  onShow() {
    if (!requireMerchantLogin()) return;
    this.loadList();
  },
  async loadList() {
    const list = await request({ url: '/api/admin/products' });
    this.setData({ list });
  },
  onInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`form.${key}`]: e.detail.value });
  },
  onCategory(e) {
    this.setData({ 'form.category': this.data.categories[e.detail.value] });
  },
  async submit() {
    const { form, editing } = this.data;
    const payload = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock),
      imageUrl: form.imageUrl,
      detailHtml: form.detailHtml,
      status: Number(form.status) ? 1 : 0
    };
    if (editing) {
      await request({ url: `/api/admin/products/${form.id}`, method: 'PUT', data: payload });
    } else {
      await request({ url: '/api/admin/products', method: 'POST', data: payload });
    }
    this.setData({ form: { ...defaultForm }, editing: false });
    this.loadList();
  },
  edit(e) {
    this.setData({ form: { ...e.currentTarget.dataset.item }, editing: true });
  },
  async toggleStatus(e) {
    const item = e.currentTarget.dataset.item;
    await request({ url: `/api/admin/products/${item.id}`, method: 'PUT', data: { status: item.status ? 0 : 1 } });
    this.loadList();
  },
  async remove(e) {
    await request({ url: `/api/admin/products/${e.currentTarget.dataset.id}`, method: 'DELETE' });
    this.loadList();
  }
});
