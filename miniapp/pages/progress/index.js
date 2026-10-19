const { api } = require('../../utils/request.js');
const store = require('../../utils/store.js');

const DAY_OPTIONS = [
  { value: 7, label: '近7天' },
  { value: 30, label: '近30天' },
  { value: 90, label: '近90天' },
];

Page({
  data: {
    days: 30,
    dayOptions: DAY_OPTIONS,
    loading: false,
    diagnosis: null,
    progress: [],
  },

  onLoad(options) {
    this.studentUserId = options.studentUserId || '';
    this.loadAll();
  },

  async loadAll() {
    await Promise.all([this.loadDiagnosis(), this.loadProgress()]);
  },

  async loadDiagnosis() {
    this.setData({ loading: true });
    try {
      const res = await api.diagnosis(this.studentUserId, this.data.days);
      this.setData({ diagnosis: res });
    } catch (err) {
      wx.showToast({ title: err.message || '诊断加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadProgress() {
    try {
      const res = await api.progress(this.studentUserId);
      this.setData({ progress: res || [] });
    } catch (err) {
      /* 进度非关键，失败静默 */
    }
  },

  onDaysChange(e) {
    const index = Number(e.detail.value);
    const days = DAY_OPTIONS[index].value;
    this.setData({ days });
    this.loadDiagnosis();
  },

  scoreClass(score) {
    if (score >= 80) return 'score-good';
    if (score < 60) return 'score-warn';
    return 'score-mid';
  },
});
