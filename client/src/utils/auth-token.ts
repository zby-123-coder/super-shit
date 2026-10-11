const TOKEN_KEY = 'jj_token';
export const UNAUTHORIZED_EVENT = 'app:unauthorized';

let token = '';
try {
  token = window.localStorage.getItem(TOKEN_KEY) ?? '';
} catch {
  token = '';
}

export function getToken(): string {
  return token;
}

export function setToken(next: string): void {
  token = next;
  try {
    window.localStorage.setItem(TOKEN_KEY, next);
  } catch {
    /* 隐私模式下忽略持久化，内存态仍可用 */
  }
}

export function clearToken(): void {
  token = '';
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}
