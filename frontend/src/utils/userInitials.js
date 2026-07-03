/**
 * 从昵称/用户名提取头像首字
 */
export function getUserInitials(name = '') {
  const text = name.trim();
  if (!text) return '?';
  if (/[\u4e00-\u9fa5]/.test(text[0])) {
    return text[0];
  }
  return text[0].toUpperCase();
}
