/**
 * 验证邮箱格式
 */
export function validateEmail(email) {
  const re = /^\S+@\S+\.\S+$/;
  return re.test(email);
}

/**
 * 验证密码强度（至少6个字符）
 */
export function validatePassword(password) {
  return password && password.length >= 6;
}

/**
 * 验证用户名（2-50个字符）
 */
export function validateUsername(username) {
  return username && username.length >= 2 && username.length <= 50;
}

/**
 * 验证数字范围
 */
export function validateNumberRange(value, min, max) {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
}
