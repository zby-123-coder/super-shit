const { api } = require('../../utils/request.js');
const store = require('../../utils/store.js');

const STATUS_TEXT = {
  open: '待完成',
  submitted: '已提交待批阅',
  approved: '已通过',
  rejected: '已退回',
};

const PRESET_COMMENTS = [
  '完成得不错，继续保持',
  '书写很工整，值得表扬',
  '思路清晰，注意计算细节',
  '有进步，下次可以再快一点',
  '错题已订正，很好',
  '订正后重新提交一次',
];

Page({
  data: {
    role: 'student',
    isStaff: false,
    tasks: null,
    loading: true,
    tab: 'tasks',
    // 打卡弹窗
    checkinVisible: false,
    checkinTask: null,
    checkinContent: '',
    duration: '30',
    // 批阅弹窗
    reviewVisible: false,
    reviewTask: null,
    reviewComment: '',
    presets: PRESET_COMMENTS,
    // 布置弹窗
    createVisible: false,
    students: [],
    picked: [],
    form: { title: '', content: '', dueAt: '' },
    // 错题本
    wrongItems: [],
    wrongVisible: false,
    wrongForm: { subject: '数学', title: '', reason: '' },
  },

  onShow() {
    this.load();
  },

  async load() {
    const me = await store.refreshMe();
    if (!me || !me.profile) return;
    const role = me.profile.role;
    const isStaff = role === 'teacher' || role === 'admin';
    this.setData({ role, isStaff, students: me.students || [] });
    let tasks = null;
    try {
      tasks = await api.tasks();
    } catch (e) {
      /* ignore */
    }
    let wrongItems = [];
    try {
      wrongItems = await api.wrongQuestions();
    } catch (e) {
      /* ignore */
    }
    this.setData({ tasks, wrongItems, loading: false });
  },

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  /* ===== 打卡 ===== */
  openCheckin(e) {
    const id = e.currentTarget.dataset.id;
    const item = (this.data.tasks?.items || []).find((t) => t.id === id);
    this.setData({ checkinVisible: true, checkinTask: item, checkinContent: '', duration: '30' });
  },
  closeCheckin() {
    this.setData({ checkinVisible: false });
  },
  onCheckinInput(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value });
  },
  async submitCheckin() {
    const task = this.data.checkinTask;
    if (!task) return;
    try {
      await api.checkin(task.id, {
        content: this.data.checkinContent,
        durationMin: Number(this.data.duration) || 0,
      });
      wx.showToast({ title: '打卡成功', icon: 'success' });
      this.setData({ checkinVisible: false });
      this.load();
    } catch (err) {
      wx.showToast({ title: err.message || '打卡失败', icon: 'none' });
    }
  },

  /* ===== 批阅 ===== */
  openReview(e) {
    const id = e.currentTarget.dataset.id;
    const item = (this.data.tasks?.items || []).find((t) => t.id === id);
    this.setData({ reviewVisible: true, reviewTask: item, reviewComment: '' });
  },
  closeReview() {
    this.setData({ reviewVisible: false });
  },
  usePreset(e) {
    this.setData({ reviewComment: e.currentTarget.dataset.text });
  },
  onReviewInput(e) {
    this.setData({ reviewComment: e.detail.value });
  },
  async submitReview(status) {
    const task = this.data.reviewTask;
    if (!task?.checkin) return;
    try {
      await api.review(task.checkin.id, { status, comment: this.data.reviewComment });
      wx.showToast({ title: status === 'approved' ? '已通过' : '已退回重做', icon: 'success' });
      this.setData({ reviewVisible: false });
      this.load();
    } catch (err) {
      wx.showToast({ title: err.message || '批阅失败', icon: 'none' });
    }
  },

  /* ===== 布置任务 ===== */
  openCreate() {
    this.setData({ createVisible: true, form: { title: '', content: '', dueAt: '' }, picked: [] });
  },
  closeCreate() {
    this.setData({ createVisible: false });
  },
  toggleStudent(e) {
    const id = e.currentTarget.dataset.id;
    const picked = this.data.picked.includes(id)
      ? this.data.picked.filter((x) => x !== id)
      : [...this.data.picked, id];
    this.setData({ picked });
  },
  onFormInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },
  async submitCreate() {
    const { picked, form } = this.data;
    if (!picked.length || !form.title.trim()) {
      wx.showToast({ title: '请选择学生并填写标题', icon: 'none' });
      return;
    }
    try {
      const created = await api.createTask({
        studentUserIds: picked,
        title: form.title.trim(),
        content: form.content.trim(),
        dueAt: form.dueAt ? new Date(form.dueAt.replace(' ', 'T')).toISOString() : undefined,
      });
      wx.showToast({ title: `已布置给 ${created.length} 名学生`, icon: 'success' });
      this.setData({ createVisible: false });
      this.load();
    } catch (err) {
      wx.showToast({ title: err.message || '布置失败', icon: 'none' });
    }
  },

  /* ===== 错题本 ===== */
  openWrong() {
    this.setData({ wrongVisible: true });
  },
  closeWrong() {
    this.setData({ wrongVisible: false });
  },
  onWrongInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`wrongForm.${field}`]: e.detail.value });
  },
  async submitWrong() {
    const { wrongForm } = this.data;
    if (!wrongForm.title.trim()) {
      wx.showToast({ title: '请填写题干', icon: 'none' });
      return;
    }
    try {
      await api.createWrongQuestion({
        subject: wrongForm.subject,
        title: wrongForm.title.trim(),
        reason: wrongForm.reason.trim(),
      });
      wx.showToast({ title: '已收入错题本', icon: 'success' });
      this.setData({ wrongVisible: false, 'wrongForm.title': '', 'wrongForm.reason': '' });
      this.load();
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' });
    }
  },
  async markCorrected(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await api.markCorrected(id);
      wx.showToast({ title: '已标记订正', icon: 'success' });
      this.load();
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },
  variant(e) {
    const title = e.currentTarget.dataset.title;
    const nums = title.match(/\d+(\.\d+)?/g);
    if (!nums || !nums.length) {
      wx.showToast({ title: '该题不适合自动变式', icon: 'none' });
      return;
    }
    const variant = title.replace(/\d+(\.\d+)?/g, (m) => {
      const n = Number(m);
      const delta = Math.max(1, Math.round(n * 0.2));
      const next = n + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * delta));
      return next > 0 ? String(next) : m;
    });
    wx.showModal({ title: '变式练习', content: variant, showCancel: false });
  },
});
