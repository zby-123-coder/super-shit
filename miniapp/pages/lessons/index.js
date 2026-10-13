const { api } = require('../../utils/request.js');
const store = require('../../utils/store.js');

Page({
  data: {
    role: 'student',
    canPick: false,
    target: '',
    candidates: [],
    summary: null,
    loading: true,
    targetLabel: '',
  },

  onShow() {
    this.load();
  },

  async load() {
    const me = await store.refreshMe();
    if (!me || !me.profile) return;
    const role = me.profile.role;
    const canPick = role === 'parent' || role === 'teacher' || role === 'admin';
    const candidates = [
      ...(me.children || []).map((c) => ({ id: c.userId, label: `${c.name}（孩子）` })),
      ...(me.students || []).map((s) => ({ id: s.userId, label: `${s.name}（学生）` })),
    ];
    this.setData({ role, canPick, candidates });

    if (canPick && !this.data.target) {
      this.setData({ summary: null, loading: false });
      return;
    }
    let summary = null;
    try {
      summary = await api.lessons(this.data.target || undefined);
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    this.setData({ summary, loading: false });
  },

  onPick(e) {
    const index = Number(e.detail.value);
    const picked = this.data.candidates[index];
    this.setData({ target: picked.id, targetLabel: picked.label }, () => this.load());
  },

  async confirm(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await api.confirmLedger(id);
      wx.showToast({ title: '已确认本次消课', icon: 'success' });
      this.load();
    } catch (err) {
      wx.showToast({ title: err.message || '确认失败', icon: 'none' });
    }
  },

  typeText(type) {
    return type === 'consume' ? '课程消课' : type === 'purchase' ? '课时发放' : '手动调整';
  },

  fmt(iso) {
    if (!iso) return '';
    return iso.slice(5, 16).replace('T', ' ');
  },
});
