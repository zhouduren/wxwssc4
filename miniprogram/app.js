App({
  globalData: {
    baseURL: 'http://localhost:3000',
    token: wx.getStorageSync('token') || '',
    role: wx.getStorageSync('role') || '',
    userInfo: wx.getStorageSync('userInfo') || null
  }
});
