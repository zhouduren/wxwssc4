const app = getApp();
const { clearLogin } = require('./auth');

function redirectToLoginByRoute() {
  const pages = getCurrentPages();
  const current = pages.length ? pages[pages.length - 1] : null;
  const route = (current && current.route) || '';
  if (route.startsWith('pages/merchant')) {
    wx.redirectTo({ url: '/pages/merchant-login/merchant-login' });
    return;
  }
  wx.redirectTo({ url: '/pages/login/login' });
}

function request({ url, method = 'GET', data = {}, auth = true }) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && app.globalData.token) {
      headers.Authorization = `Bearer ${app.globalData.token}`;
    }
    wx.request({
      url: `${app.globalData.baseURL}${url}`,
      method,
      data,
      header: headers,
      success: (res) => {
        if (res.data && res.data.code === 0) {
          resolve(res.data.data);
          return;
        }
        if (res.statusCode === 401 || res.statusCode === 403) {
          clearLogin();
          redirectToLoginByRoute();
        }
        const msg = (res.data && res.data.message) || '请求失败';
        wx.showToast({ title: msg, icon: 'none' });
        reject(new Error(msg));
      },
      fail: (err) => {
        wx.showToast({ title: '网络异常', icon: 'none' });
        reject(err);
      }
    });
  });
}

module.exports = { request };
