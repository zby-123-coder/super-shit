const { api } = require('../../utils/request.js');
const store = require('../../utils/store.js');

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

Page({
  data: {
    role: 'student',
    offset: 0,
    week: null,
    groups: [],
    loading: true,
  },

  onShow() {
    this.load();
  },

  async load() {
    const me = await store.refreshMe();
    if (!me || !me.profile) return;
    this.setData({ role: me.profile.role });
    const offset = this.data.offset;
    const weekStart =
      offset === 0
        ? undefined
        : new Date(Date.now() + offset * 7 * 86400000).toISOString();
    let week = null;
    try {
      week = await api.week(weekStart);
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    const groups = [];
    (week?.items || []).forEach((item) => {
      const d = new Date(item.startAt);
      const key = `${d.getMonth() + 1}月${d.getDate()}日`;
      const found = groups.find((g) => g.day === key);
      const payload = {
        ...item,
        timeText: `${String(d.getHours()).padStart(2, '0')}:${String(
          d.getMinutes(),
        ).padStart(2, '0')}`,
      };
      if (found) {
        found.items.push(payload);
      } else {
        groups.push({ day: key, weekday: DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1], items: [payload] });
      }
    });
    this.setData({ week, groups, loading: false });
  },

  shiftWeek(e) {
    const delta = Number(e.currentTarget.dataset.delta);
    this.setData({ offset: this.data.offset + delta }, () => this.load());
  },

  isStaff() {
    return this.data.role === 'teacher' || this.data.role === 'admin';
  },

  async consume(e) {
    const id = e.currentTarget.dataset.id;
    try {
      const res = await api.consume(id);
      wx.showToast({ title: `已消课，剩余 ${res.remaining} 课时`, icon: 'success' });
      this.load();
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },

  async markLeave(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await api.updateCourseStatus(id, { status: 'leave' });
      wx.showToast({ title: '已标记请假', icon: 'success' });
      this.load();
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },
});
