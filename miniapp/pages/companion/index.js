const { api } = require('../../utils/request.js');

const STAGES = [
  { key: 'understand', label: '了解卡点' },
  { key: 'guide', label: '给提示' },
  { key: 'consolidate', label: '巩固方法' },
  { key: 'close', label: '收尾' },
];

Page({
  data: {
    session: null,
    messages: [],
    input: '',
    sending: false,
    starting: true,
    stages: STAGES,
    stageIndex: 0,
  },

  onLoad(options) {
    this.wrongQuestionId = options.wrongQuestionId || '';
    this.start();
  },

  async start() {
    try {
      const res = await api.companionStart({ wrongQuestionId: this.wrongQuestionId || undefined });
      this.setData({
        session: res.session,
        messages: res.messages,
        stageIndex: this.indexOfStage(res.session.stage),
      });
    } catch (err) {
      wx.showToast({ title: err.message || '会话创建失败', icon: 'none' });
    } finally {
      this.setData({ starting: false });
    }
  },

  indexOfStage(stage) {
    const index = STAGES.findIndex((s) => s.key === stage);
    return index < 0 ? 0 : index;
  },

  onInput(e) {
    this.setData({ input: e.detail.value });
  },

  async send() {
    const content = this.data.input.trim();
    const session = this.data.session;
    if (!content || !session || this.data.sending) return;
    this.setData({
      input: '',
      sending: true,
      messages: [...this.data.messages, { id: 'local', role: 'user', content }],
    });
    try {
      const res = await api.companionSend(session.id, content);
      this.setData({
        session: res.session,
        messages: [...this.data.messages.filter((m) => m.id !== 'local'), ...res.messages],
        stageIndex: this.indexOfStage(res.session.stage),
      });
    } catch (err) {
      wx.showToast({ title: '发送失败', icon: 'none' });
    } finally {
      this.setData({ sending: false });
    }
  },

  noop() {},
});
