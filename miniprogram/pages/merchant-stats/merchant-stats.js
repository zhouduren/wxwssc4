const { request } = require('../../utils/request');
const { requireMerchantLogin } = require('../../utils/auth');

Page({
  data: {
    stats: null,
    trend: [],
    category: []
  },
  async onShow() {
    if (!requireMerchantLogin()) return;
    const stats = await request({ url: '/api/admin/stats' });
    const trend = (stats.salesTrend || []).map((it) => ({ ...it, amount: Number(it.amount) }));
    const maxAmount = trend.length ? Math.max(...trend.map((t) => t.amount)) : 1;
    const trendView = trend.map((t) => ({ ...t, percent: Math.round((t.amount / maxAmount) * 100) }));
    const category = (stats.categorySales || []).map((c) => ({ ...c, salesCount: Number(c.salesCount) }));
    const maxCat = category.length ? Math.max(...category.map((c) => c.salesCount)) : 1;
    const categoryView = category.map((c) => ({
      ...c,
      percent: Math.round((c.salesCount / maxCat) * 100)
    }));
    this.setData({ stats, trend: trendView, category: categoryView });
  }
});
