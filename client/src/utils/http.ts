import axios, { type AxiosInstance } from 'axios';
import { clearToken, getToken, UNAUTHORIZED_EVENT } from './auth-token';

/**
 * 自持 HTTP 客户端（替代平台 axiosForBackend）。
 * - baseURL 取 CLIENT_BASE_PATH（同源部署 '/'）
 * - 自动注入 Bearer token；401 时清理本地登录态
 */
const baseURL = process.env.CLIENT_BASE_PATH || '/';

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);
