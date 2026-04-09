const { request } = require('../../utils/request');
const { requireUserLogin } = require('../../utils/auth');

Page({
  data: {
    categories: [],
    activeCategory: '',
    products: [],
    quantities: {}
  },
  async onLoad(options) {
    this.defaultCategory = options.category || '';
  },
  async onShow() {
    if (!requireUserLogin()) return;
    const categories = await request({ url: '/api/categories' });
    const activeCategory = this.defaultCategory || categories[0] || '';
    this.setData({ categories, activeCategory });
    this.loadProducts(activeCategory);
  },
  async loadProducts(category) {
    const products = await request({ url: `/api/products?category=${encodeURIComponent(category)}` });
    const quantities = {};
    products.forEach((p) => (quantities[p.id] = quantities[p.id] || 1));
    this.setData({ products, activeCategory: category, quantities });
  },
  onSwitch(e) {
    this.loadProducts(e.currentTarget.dataset.category);
  },
  incQty(e) {
    const id = Number(e.currentTarget.dataset.id);
    const product = this.data.products.find((p) => p.id === id) || {};
    const stock = Number(product.stock || 9999);
    const cur = Number(this.data.quantities[id] || 1);
    const next = Math.min(cur + 1, stock);
    this.setData({ [`quantities.${id}`]: next });
  },
  decQty(e) {
    const id = Number(e.currentTarget.dataset.id);
    const cur = Number(this.data.quantities[id] || 1);
    const next = Math.max(cur - 1, 1);
    this.setData({ [`quantities.${id}`]: next });
  },
  async addToCart(e) {
    const id = Number(e.currentTarget.dataset.id);
    const qty = Number(this.data.quantities[id] || 1);
    await request({ url: '/api/cart', method: 'POST', data: { productId: id, quantity: qty } });
    wx.showToast({ title: '已加入购物车', icon: 'success' });
  },
  toDetail(e) {
    wx.navigateTo({ url: `/pages/product-detail/product-detail?id=${e.currentTarget.dataset.id}` });
  }
});
