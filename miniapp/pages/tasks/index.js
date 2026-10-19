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
    checkinImages: [],
    // 批阅弹窗
    reviewVisible: false,
    reviewTask: null,
    grading: false,
    gradeResult: { items: [], summary: '', available: true },
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
  chooseImages() {
    wx.chooseMedia({
      count: 3,
      mediaType: ['image'],
      success: async (res) => {
        const files = res.tempFiles.map((f) => f.tempFilePath);
        wx.showLoading({ title: '上传中' });
        try {
          const urls = [];
          for (const filePath of files) {
            const result = await require('../../utils/request.js').api.uploadImage(filePath);
            urls.push(result.url);
          }
          this.setData({ checkinImages: [...this.data.checkinImages, ...urls] });
        } catch (e) {
          wx.showToast({ title: '上传失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      },
    });
  },

  async submitCheckin() {
    const task = this.data.checkinTask;
    if (!task) return;
    try {
      await api.checkin(task.id, {
        content: this.data.checkinContent,
        durationMin: Number(this.data.duration) || 0,
        imageUrls: this.data.checkinImages,
      });
      wx.showToast({ title: '打卡成功', icon: 'success' });
      this.setData({ checkinVisible: false, checkinImages: [] });
      this.load();
    } catch (err) {
      wx.showToast({ title: err.message || '打卡失败', icon: 'none' });
    }
  },

  /* ===== 批阅 ===== */
  openReview(e) {
    const id = e.currentTarget.dataset.id;
    const item = (this.data.tasks?.items || []).find((t) => t.id === id);
    this.setData({ reviewVisible: true, reviewTask: item, reviewComment: '', gradeResult: { items: [], summary: '', available: true } });
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
  async gradeHomework() {
    const task = this.data.reviewTask;
    if (!task) return;
    this.setData({ grading: true });
    try {
      const res = await api.gradeHomework(task.id);
      this.setData({
        gradeResult: res || { items: [], summary: '', available: false },
      });
      if (res && !res.available) {
        wx.showToast({ title: '未配置 AI_KEY，识图不可用', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '识图批改失败，请人工批改', icon: 'none' });
    } finally {
      this.setData({ grading: false });
    }
  },

  async genDraft() {
    const task = this.data.reviewTask;
    if (!task) return;
    try {
      const res = await require('../../utils/request.js').api.aiReviewDraft({
        content: task.checkin?.content ?? '',
        durationMin: task.checkin?.durationMin ?? 0,
        taskTitle: task.title,
      });
      this.setData({ reviewComment: res.draft });
    } catch (err) {
      wx.showToast({ title: '草稿生成失败', icon: 'none' });
    }
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
  async explainQuestion(e) {
    const { subject, title, kp, reason } = e.currentTarget.dataset;
    try {
      const res = await api.explain({
        subject: subject || '数学',
        title,
        knowledgePoint: kp,
        wrongReason: reason,
      });
      if (!res || !res.available) {
        const hint = (res.steps || []).find((s) => s.phase === 'hint');
        wx.showModal({
          title: '思路提示（AI 讲解未启用）',
          content: hint ? hint.text : '先独立思考 5 分钟，再对照解析',
          showCancel: false,
        });
        return;
      }
      const read = (res.steps || []).find((s) => s.phase === 'read');
      const hint = (res.steps || []).find((s) => s.phase === 'hint');
      const explain = (res.steps || []).find((s) => s.phase === 'explain');
      const content = [
        read ? `【审题】${read.text}` : '',
        hint ? `【提示】${hint.text}` : '',
        '',
        '先自己想一想，再查看分步讲解',
      ].filter(Boolean).join('\n');
      wx.showModal({
        title: '引导式讲解',
        content,
        confirmText: '查看讲解',
        cancelText: '再想想',
        success: (r) => {
          if (!r.confirm || !explain) return;
          wx.showModal({ title: '分步讲解', content: explain.text, showCancel: false });
        },
      });
    } catch (err) {
      wx.showToast({ title: '讲解加载失败', icon: 'none' });
    }
  },

  async variant(e) {
    const { title, subject, kp } = e.currentTarget.dataset;
    try {
      // 题库优先（同学科同知识点），不足时 AI 生成补齐并入库
      const list = await api.qbRecommend({
        subject: subject || '数学',
        knowledgePoint: kp || subject || '数学',
        count: 3,
      });
      if (!list || !list.length) {
        const res = await api.aiVariant({ subject: subject || '数学', title });
        if (!res.variant) {
          wx.showToast({ title: '暂无同类题，可配置 AI 或录题', icon: 'none' });
          return;
        }
        wx.showModal({ title: '变式练习', content: res.variant, showCancel: false });
        return;
      }
      const text = list
        .map((q, i) => `${i + 1}. ${q.title}${q.source === 'ai' ? '（AI生成）' : ''}`)
        .join('\n');
      wx.showModal({ title: '举一反三 · 同类题', content: text, showCancel: false });
    } catch (err) {
      wx.showToast({ title: '推荐失败', icon: 'none' });
    }
  },
});
