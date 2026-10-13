const { request, setToken, getToken, clearToken } = require('./utils/request.js');
const { API_BASE } = require('./utils/config.js');

App({
  globalData: {
    apiBase: API_BASE,
  },

  onLaunch() {
    // 启动时检查本地是否已有登录态
    const token = getToken();
    if (token) {
      this.globalData.token = token;
    }
  },

  onShow() {},

  request,
  setToken,
  clearToken,
});
