const { api } = require('../../utils/request.js');
const store = require('../../utils/store.js');

const ROLE_LABEL = { student: '学生', parent: '家长', teacher: '老师', admin: '管理员' };

Page({
  data: {
    profile: null,
    roleText: '',
    me: null,
    family: null,
    messages: [],
    unread: 0,
    // 添加孩子
    childVisible: false,
    childForm: { name: '', grade: '', loginName: '', password: '' },
    // 添加学生（老师）
    studentCode: '',
    // 编辑资料
    editVisible: false,
    editForm: { name: '', grade: '', subjectTags: '', role: 'student', notifyMute: false },
  },

  onShow() {
    this.load();
  },

  async load() {
    const me = await store.refreshMe();
    if (!me || !me.profile) return;
    let messages = [];
    try {
      const res = await api.messages();
      messages = res.items || [];
    } catch (e) {
      /* ignore */
    }
    let family = null;
    try {
      family = await api.family();
    } catch (e) {
      /* ignore */
    }
    this.setData({
      profile: me.profile,
      roleText: ROLE_LABEL[me.profile.role],
      me,
      family,
      messages,
      unread: messages.filter((m) => !m.isRead).length,
      editForm: {
        name: me.profile.name,
        grade: me.profile.grade,
        subjectTags: me.profile.subjectTags,
        role: me.profile.role,
        notifyMute: !!me.profile.notifyMute,
      },
    });
  },

  async markAllRead() {
    try {
      await api.markAllRead();
      this.load();
      wx.showToast({ title: '已全部已读', icon: 'success' });
    } catch (e) {
      /* ignore */
    }
  },

  /* ===== 编辑资料 ===== */
  openEdit() {
    this.setData({ editVisible: true });
  },
  closeEdit() {
    this.setData({ editVisible: false });
  },
  onEditInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`editForm.${field}`]: e.detail.value });
  },
  toggleMute() {
    this.setData({ 'editForm.notifyMute': !this.data.editForm.notifyMute });
  },
  async saveEdit() {
    const f = this.data.editForm;
    if (!f.name.trim()) {
      wx.showToast({ title: '请填写姓名', icon: 'none' });
      return;
    }
    try {
      await api.saveProfile({
        role: f.role,
        name: f.name.trim(),
        grade: f.grade,
        subjectTags: f.subjectTags,
        notifyMute: f.notifyMute,
      });
      wx.showToast({ title: '已保存', icon: 'success' });
      this.setData({ editVisible: false });
      this.load();
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' });
    }
  },

  /* ===== 添加孩子 ===== */
  openChild() {
    this.setData({ childVisible: true });
  },
  closeChild() {
    this.setData({ childVisible: false });
  },
  onChildInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`childForm.${field}`]: e.detail.value });
  },
  async submitChild() {
    const f = this.data.childForm;
    if (!f.name.trim() || !f.loginName.trim()) {
      wx.showToast({ title: '请填写孩子姓名与登录名', icon: 'none' });
      return;
    }
    try {
      await api.createChild({
        loginName: f.loginName.trim(),
        password: f.password,
        name: f.name.trim(),
        grade: f.grade,
      });
      wx.showToast({ title: `孩子「${f.name.trim()}」已加入家庭`, icon: 'success' });
      this.setData({ childVisible: false, childForm: { name: '', grade: '', loginName: '', password: '' } });
      this.load();
    } catch (err) {
      wx.showToast({ title: err.message || '创建失败', icon: 'none' });
    }
  },

  /* ===== 老师添加学生 ===== */
  onStudentCode(e) {
    this.setData({ studentCode: e.detail.value });
  },
  async addStudent() {
    if (!this.data.studentCode.trim()) {
      wx.showToast({ title: '请输入学生邀请码', icon: 'none' });
      return;
    }
    try {
      const res = await api.addStudent(this.data.studentCode.trim());
      wx.showToast({ title: `已添加学生 ${res.studentName}`, icon: 'success' });
      this.setData({ studentCode: '' });
      this.load();
    } catch (err) {
      wx.showToast({ title: err.message || '添加失败', icon: 'none' });
    }
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确认退出当前账号？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await api.logout();
        } catch (e) {
          /* ignore */
        }
        store.logout();
        wx.reLaunch({ url: '/pages/login/index' });
      },
    });
  },
});
