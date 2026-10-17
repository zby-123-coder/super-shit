/**
 * 网络层：与 Web 端共用同一后端，Bearer token 鉴权。
 * 约定：所有业务接口返回 { code, data, message } 风格或裸 JSON，
 * 这里统一透传 data，401 时清 token 并回登录页。
 */
const TOKEN_KEY = 'jj_token';
const { API_BASE } = require('./config.js');

function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || '';
}

function setToken(token) {
  wx.setStorageSync(TOKEN_KEY, token);
}

function clearToken() {
  wx.removeStorageSync(TOKEN_KEY);
}

function request(options) {
  const { url, method = 'GET', data, params } = options;
  const token = getToken();
  const query = params
    ? Object.keys(params)
        .filter((k) => params[k] !== undefined && params[k] !== '')
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join('&')
    : '';
  const fullUrl = `${API_BASE}${url}${query ? `?${query}` : ''}`;

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res) => {
        if (res.statusCode === 401) {
          clearToken();
          const pages = getCurrentPages();
          const isLogin =
            pages.length > 0 && pages[pages.length - 1].route === 'pages/login/index';
          if (!isLogin) {
            wx.reLaunch({ url: '/pages/login/index' });
          }
          reject(Object.assign(new Error('登录已失效'), { statusCode: 401 }));
          return;
        }
        const body = res.data || {};
        if (body && body.error) {
          reject(
            Object.assign(new Error(body.error.message || '请求失败'), {
              statusCode: res.statusCode,
            }),
          );
          return;
        }
        resolve(body);
      },
      fail: (err) => {
        wx.showToast({ title: '网络异常', icon: 'none' });
        reject(err);
      },
    });
  });
}

const api = {
  // auth
  login: (loginName, password) =>
    request({ url: '/api/auth/login', method: 'POST', data: { loginName, password } }),
  register: (payload) =>
    request({ url: '/api/auth/register', method: 'POST', data: payload }),
  logout: () => request({ url: '/api/auth/logout', method: 'POST' }),
  me: () => request({ url: '/api/account/me' }),
  saveProfile: (payload) =>
    request({ url: '/api/account/profile', method: 'POST', data: payload }),
  family: () => request({ url: '/api/account/family' }),
  createChild: (payload) =>
    request({ url: '/api/account/child', method: 'POST', data: payload }),
  addStudent: (inviteCode) =>
    request({ url: '/api/account/teach', method: 'POST', data: { inviteCode } }),

  // course / lessons
  week: (weekStart) => request({ url: '/api/course/week', params: { weekStart } }),
  createCourse: (payload) =>
    request({ url: '/api/course', method: 'POST', data: payload }),
  updateCourseStatus: (id, payload) =>
    request({ url: `/api/course/${id}/status`, method: 'PATCH', data: payload }),
  consume: (id) => request({ url: `/api/course/${id}/consume`, method: 'POST' }),
  lessons: (studentUserId) =>
    request({ url: '/api/course/lessons', params: { studentUserId } }),
  grantLessons: (payload) =>
    request({ url: '/api/course/lessons/grant', method: 'POST', data: payload }),
  confirmLedger: (id) =>
    request({ url: `/api/course/ledger/${id}/confirm`, method: 'PATCH' }),

  // tasks / checkin / wrong questions
  tasks: () => request({ url: '/api/task' }),
  createTask: (payload) =>
    request({ url: '/api/task', method: 'POST', data: payload }),
  checkin: (id, payload) =>
    request({ url: `/api/task/${id}/checkin`, method: 'POST', data: payload }),
  review: (id, payload) =>
    request({ url: `/api/task/checkin/${id}/review`, method: 'PATCH', data: payload }),
  progress: (studentUserId) =>
    request({ url: '/api/progress', params: { studentUserId } }),
  saveProgress: (payload) =>
    request({ url: '/api/progress', method: 'POST', data: payload }),
  wrongQuestions: () => request({ url: '/api/wrong-question' }),
  createWrongQuestion: (payload) =>
    request({ url: '/api/wrong-question', method: 'POST', data: payload }),
  markCorrected: (id) =>
    request({ url: `/api/wrong-question/${id}/corrected`, method: 'PATCH' }),

  // content / report / message
  articles: (columnType) =>
    request({ url: '/api/content', params: { columnType } }),
  articleDetail: (id) => request({ url: `/api/content/${id}` }),
  toggleFavorite: (id) =>
    request({ url: `/api/content/${id}/favorite`, method: 'POST' }),
  weeklyReport: (studentUserId) =>
    request({ url: '/api/report/weekly', params: { studentUserId } }),
  messages: () => request({ url: '/api/message' }),
  markAllRead: () => request({ url: '/api/message/read-all', method: 'PATCH' }),

  // upload
  uploadImage: (filePath) =>
    new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${API_BASE}/api/upload/image`,
        filePath,
        name: 'file',
        header: {
          Authorization: `Bearer ${getToken()}`,
          Cookie: 'suda-csrf-token=x',
          'X-Suda-Csrf-Token': 'x',
        },
        success: (res) => {
          try {
            const body = JSON.parse(res.data);
            if (body.url) resolve(body);
            else reject(new Error((body.error && body.error.message) || '上传失败'));
          } catch (e) {
            reject(e);
          }
        },
        fail: reject,
      });
    }),

  // ai
  aiStatus: () => request({ url: '/api/ai/status' }),
  aiReviewDraft: (payload) =>
    request({ url: '/api/ai/review-draft', method: 'POST', data: payload }),
  aiVariant: (payload) =>
    request({ url: '/api/ai/variant', method: 'POST', data: payload }),
  gradeHomework: (taskId) =>
    request({ url: `/api/ai/grade-homework/${taskId}`, method: 'POST' }),

  // question-bank
  qbRecommend: (payload) =>
    request({ url: '/api/question-bank/recommend', method: 'POST', data: payload }),
  qbCreate: (payload) =>
    request({ url: '/api/question-bank', method: 'POST', data: payload }),

  // admin
  overview: () => request({ url: '/api/admin/overview' }),
  users: () => request({ url: '/api/admin/users' }),
  updateUser: (id, payload) =>
    request({ url: `/api/admin/users/${id}`, method: 'PATCH', data: payload }),
  assign: (payload) =>
    request({ url: '/api/admin/assign', method: 'POST', data: payload }),
  broadcast: (payload) =>
    request({ url: '/api/message/broadcast', method: 'POST', data: payload }),

  // admin - content
  contentAdminList: (params) => request({ url: '/api/content', params }),
  contentCreate: (payload) =>
    request({ url: '/api/content', method: 'POST', data: payload }),
  contentSetStatus: (id, payload) =>
    request({ url: `/api/content/${id}/status`, method: 'PATCH', data: payload }),
  contentDelete: (id) => request({ url: `/api/content/${id}`, method: 'DELETE' }),
};

module.exports = { request, api, getToken, setToken, clearToken, API_BASE };
