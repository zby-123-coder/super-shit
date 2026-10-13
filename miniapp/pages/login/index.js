const { login } = require('../../utils/store.js');

Page({
  data: {
    loginName: '',
    password: '',
    role: 'parent',
    name: '',
    extra: '',
    familyCode: '',
    submitting: false,
    mode: 'login',
  },

  onLoad() {
    const store = require('../../utils/store.js');
    if (store.isLoggedIn()) {
      wx.reLaunch({ url: '/pages/home/index' });
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  switchMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
  },

  pickRole(e) {
    this.setData({ role: e.currentTarget.dataset.role });
  },

  async submit() {
    const { mode, loginName, password, role, name, extra, familyCode } = this.data;
    if (mode === 'login') {
      if (!loginName || !password) {
        wx.showToast({ title: '请输入登录名与密码', icon: 'none' });
        return;
      }
      this.setData({ submitting: true });
      try {
        const res = await login(loginName, password);
        wx.showToast({ title: `欢迎 ${res.name}`, icon: 'success' });
        wx.reLaunch({ url: '/pages/home/index' });
      } catch (err) {
        wx.showToast({ title: err.message || '登录失败', icon: 'none' });
      } finally {
        this.setData({ submitting: false });
      }
      return;
    }

    if (!loginName || !password || !name) {
      wx.showToast({ title: '请填写登录名、密码与姓名', icon: 'none' });
      return;
    }
    if (role === 'student' && !familyCode) {
      wx.showToast({ title: '学生注册需填家庭邀请码', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    try {
      const { api } = require('../../utils/request.js');
      const { setToken } = require('../../utils/request.js');
      const { refreshMe } = require('../../utils/store.js');
      const res = await api.register({
        loginName,
        password,
        role,
        name,
        grade: role === 'student' ? extra : undefined,
        subjectTags: role === 'teacher' ? extra : undefined,
        familyInviteCode:
          role === 'student' || role === 'parent' ? familyCode : undefined,
      });
      setToken(res.token);
      await refreshMe();
      wx.showToast({ title: '注册成功', icon: 'success' });
      wx.reLaunch({ url: '/pages/home/index' });
    } catch (err) {
      wx.showToast({ title: err.message || '注册失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
