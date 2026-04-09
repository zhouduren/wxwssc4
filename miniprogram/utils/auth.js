const app = getApp();

function saveLogin(data) {
  app.globalData.token = data.token;
  app.globalData.role = data.role;
  app.globalData.userInfo = data.user;
  wx.setStorageSync('token', data.token);
  wx.setStorageSync('role', data.role);
  wx.setStorageSync('userInfo', data.user);
}

function clearLogin() {
  app.globalData.token = '';
  app.globalData.role = '';
  app.globalData.userInfo = null;
  wx.removeStorageSync('token');
  wx.removeStorageSync('role');
  wx.removeStorageSync('userInfo');
}

function requireUserLogin() {
  if (!app.globalData.token || app.globalData.role !== 'user') {
    wx.redirectTo({ url: '/pages/login/login' });
    return false;
  }
  return true;
}

function requireMerchantLogin() {
  if (!app.globalData.token || app.globalData.role !== 'merchant') {
    wx.redirectTo({ url: '/pages/merchant-login/merchant-login' });
    return false;
  }
  return true;
}

module.exports = { saveLogin, clearLogin, requireUserLogin, requireMerchantLogin };
