/** 账号状态：全局缓存 me，页面按需刷新 */
const { api, setToken, clearToken, getToken } = require('./request.js');

let me = null;
const listeners = [];

function emit() {
  listeners.forEach((fn) => fn(me));
}

async function refreshMe() {
  if (!getToken()) {
    me = null;
    emit();
    return null;
  }
  try {
    me = await api.me();
  } catch (e) {
    me = null;
  }
  emit();
  return me;
}

async function login(loginName, password) {
  const res = await api.login(loginName, password);
  setToken(res.token);
  await refreshMe();
  return res;
}

function logout() {
  clearToken();
  me = null;
  emit();
}

function onChange(fn) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

module.exports = {
  refreshMe,
  login,
  logout,
  onChange,
  getMe: () => me,
  isLoggedIn: () => !!getToken(),
};
