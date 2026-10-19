const { api } = require('../../utils/request.js');
const store = require('../../utils/store.js');

const ROLE_LABEL = { student: '学生', parent: '家长', teacher: '老师', admin: '管理员' };

function today() {
  const d = new Date();
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

Page({
  data: {
    profile: null,
    role: 'student',
    childLabel: '',
    unread: 0,
    loading: true,
    todayCourses: [],
    tasks: null,
    lessons: null,
    remaining: 0,
    alertSubjects: [],
    pendingReview: 0,
    students: [],
    overview: null,
    blank: false,
    articles: [],
  },

  onShow() {
    this.loadAll();
  },

  async loadAll() {
    const me = await store.refreshMe();
    if (!me || !me.profile) return;
    const role = me.profile.role;
    this.setData({
      profile: me.profile,
      role,
      roleText: ROLE_LABEL[role],
      students: me.students || [],
      childLabel:
        role === 'parent' && (me.children || []).length
          ? `${me.children[0].name} 的学习概览`
          : role === 'student'
            ? '今日学习概览'
            : role === 'teacher'
              ? '今日授课概览'
              : '团队运营概览',
    });

    const results = await Promise.allSettled([
      api.week(),
      api.tasks(),
      role === 'student' || role === 'admin' ? api.lessons() : Promise.resolve(null),
      api.messages(),
      role === 'admin' ? api.overview() : Promise.resolve(null),
      api.articles(),
    ]);

    const week = results[0].status === 'fulfilled' ? results[0].value : null;
    const tasks = results[1].status === 'fulfilled' ? results[1].value : null;
    const lessons = results[2].status === 'fulfilled' ? results[2].value : null;
    const msgs = results[3].status === 'fulfilled' ? results[3].value : null;
    const overview = results[4].status === 'fulfilled' ? results[4].value : null;
    const articles = results[5].status === 'fulfilled' ? results[5].value : null;

    const todayStr = new Date().toISOString().slice(0, 10);
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    const todayCourses = (week?.items || [])
      .filter((item) => {
        const local = new Date(new Date(item.startAt).getTime() - tzOffset)
          .toISOString()
          .slice(0, 10);
        return local === todayStr;
      })
      .map((item) => {
        const d = new Date(new Date(item.startAt).getTime() - tzOffset);
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        return { ...item, timeText: `${hh}:${mm}` };
      });

    const remaining = (lessons?.accounts || []).reduce(
      (sum, a) => sum + a.remaining,
      0,
    );
    const alertSubjects = (lessons?.accounts || [])
      .filter((a) => a.remaining <= a.alertThreshold)
      .map((a) => a.subject);

    this.setData({
      todayCourses,
      tasks,
      lessons,
      remaining,
      alertSubjects,
      unread: msgs?.unreadCount ?? 0,
      pendingReview: tasks?.pendingCount ?? 0,
      overview,
      articles: (articles?.items || []).slice(0, 3),
      blank:
        role !== 'admin' &&
        todayCourses.length === 0 &&
        (tasks?.items || []).length === 0,
      loading: false,
    });
  },

  goProgress() {
    wx.navigateTo({ url: '/pages/progress/index' });
  },

  async goReport() {
    try {
      const report = await api.weeklyReport();
      wx.showModal({
        title: `${report.studentName} 学习周报`,
        content: report.text,
        showCancel: false,
        confirmText: '知道了',
      });
    } catch (err) {
      wx.showToast({ title: err.message || '生成失败', icon: 'none' });
    }
  },

  go(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    if (url.startsWith('tab:')) {
      wx.switchTab({ url: url.slice(4) });
    } else {
      wx.navigateTo({ url }).catch(() => wx.switchTab({ url }));
    }
  },
});
