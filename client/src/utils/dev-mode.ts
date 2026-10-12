/**
 * 开发者模式开关。
 *
 * 当前策略：本地访问（localhost / 127.0.0.1）恒为 true，
 * 底部「切换」Tab 与全局浮动身份切换器在本地开发阶段【永久保留】。
 *
 * 外发时若要移除这些开发入口，只改这一个文件即可：
 *   export const isDevMode = false;
 * 无需逐个改动页面和组件。
 */
export const isDevMode =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);
