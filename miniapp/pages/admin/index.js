const { api, API_BASE, getToken } = require('../../utils/request.js');

const TABS = [
  { key: 'overview', label: '概览' },
  { key: 'users', label: '用户' },
  { key: 'content', label: '内容' },
  { key: 'notice', label: '通知' },
];

const ROLE_LABEL = { student: '学生', parent: '家长', teacher: '老师', admin: '管理员' };
const COLUMN_LABEL = { case: '案例', trial: '试听', inspect: '巡教', news: '资讯' };

Page({
  data: {
    tab: 'overview',
    tabs: TABS,
    loading: false,
    // 概览
    stats: null,
    // 用户
    users: [],
    userKeyword: '',
    // 内容
    articles: [],
    publishVisible: false,
    publishForm: { title: '', columnType: 'case', summary: '', content: '' },
    // 通知
    noticeForm: { title: '', content: '', role: '' },
  },

  onShow() {
    this.loadTab(this.data.tab);
  },

  onTab(e) {
    const tab = e.currentTarget.dataset.key;
    this.setData({ tab });
    this.loadTab(tab);
  },

  async loadTab(tab) {
    this.setData({ loading: true });
    try {
      if (tab === 'overview') await this.loadOverview();
      if (tab === 'users') await this.loadUsers();
      if (tab === 'content') await this.loadArticles();
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadOverview() {
    const stats = await api.overview();
    this.setData({ stats });
  },

  async loadUsers() {
    const res = await api.users();
    this.setData({ users: res.items || [] });
  },

  onUserKeyword(e) {
    this.setData({ userKeyword: e.detail.value });
  },

  async searchUsers() {
    await this.loadUsers();
  },

  async toggleUser(e) {
    const { id, active } = e.currentTarget.dataset;
    try {
      await api.updateUser(id, { isActive: !active });
      wx.showToast({ title: active ? '已停用' : '已启用', icon: 'success' });
      await this.loadUsers();
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },

  async cycleRole(e) {
    const { id, role } = e.currentTarget.dataset;
    const order = ['student', 'parent', 'teacher', 'admin'];
    const next = order[(order.indexOf(role) + 1) % order.length];
    try {
      await api.updateUser(id, { role: next });
      wx.showToast({ title: `已改为${ROLE_LABEL[next]}`, icon: 'success' });
      await this.loadUsers();
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },

  /* ===== 内容 ===== */
  async loadArticles() {
    const res = await api.contentAdminList({ includeOffline: 'true' });
    this.setData({ articles: res.items || [] });
  },

  openPublish() {
    this.setData({ publishVisible: true });
  },
  closePublish() {
    this.setData({ publishVisible: false, publishForm: { title: '', columnType: 'case', summary: '', content: '' } });
  },
  onPublishInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`publishForm.${field}`]: e.detail.value });
  },
  async submitPublish() {
    const f = this.data.publishForm;
    if (!f.title.trim() || !f.content.trim()) {
      wx.showToast({ title: '请填写标题与正文', icon: 'none' });
      return;
    }
    try {
      await api.contentCreate({
        title: f.title.trim(),
        columnType: f.columnType,
        summary: f.summary,
        content: f.content,
      });
      wx.showToast({ title: '已发布', icon: 'success' });
      this.closePublish();
      await this.loadArticles();
    } catch (err) {
      wx.showToast({ title: err.message || '发布失败', icon: 'none' });
    }
  },

  async toggleArticleStatus(e) {
    const { id, status } = e.currentTarget.dataset;
    const next = status === 'published' ? 'offline' : 'published';
    try {
      await api.contentSetStatus(id, { status: next });
      wx.showToast({ title: next === 'offline' ? '已下架' : '已上架', icon: 'success' });
      await this.loadArticles();
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },

  async deleteArticle(e) {
    const { id } = e.currentTarget.dataset;
    const confirm = await new Promise((resolve) => {
      wx.showModal({ title: '删除内容', content: '删除后不可恢复，确认？', success: (r) => resolve(r.confirm) });
    });
    if (!confirm) return;
    try {
      await api.contentDelete(id);
      wx.showToast({ title: '已删除', icon: 'success' });
      await this.loadArticles();
    } catch (err) {
      wx.showToast({ title: err.message || '删除失败', icon: 'none' });
    }
  },

  onNoticeRole(e) {
    this.setData({ 'noticeForm.role': e.currentTarget.dataset.role });
  },
  onColumnPick(e) {
    this.setData({ 'publishForm.columnType': e.currentTarget.dataset.column });
  },
  noop() {},

  async exportCsv(e) {
    const { type } = e.currentTarget.dataset;
    wx.showLoading({ title: '导出中' });
    try {
      const res = await new Promise((resolve, reject) => {
        wx.downloadFile({
          url: `${API_BASE}/api/admin/export/${type}`,
          header: { Authorization: `Bearer ${getToken()}` },
          success: resolve,
          fail: reject,
        });
      });
      if (res.statusCode !== 200) throw new Error('导出失败');
      await wx.openDocument({ filePath: res.tempFilePath, showMenu: true });
    } catch (err) {
      wx.showToast({ title: '导出失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  /* ===== 通知 ===== */
  onNoticeInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`noticeForm.${field}`]: e.detail.value });
  },
  async sendNotice() {
    const f = this.data.noticeForm;
    if (!f.title.trim() || !f.content.trim()) {
      wx.showToast({ title: '请填写标题与内容', icon: 'none' });
      return;
    }
    try {
      const res = await api.broadcast({
        title: f.title.trim(),
        content: f.content.trim(),
        ...(f.role ? { role: f.role } : {}),
      });
      wx.showToast({ title: `已发送 ${res.count ?? 0} 人`, icon: 'success' });
      this.setData({ noticeForm: { title: '', content: '', role: '' } });
    } catch (err) {
      wx.showToast({ title: err.message || '发送失败', icon: 'none' });
    }
  },
});
