import dayjs from 'dayjs';

/**
 * 计算孕周
 * @param {Date|string} lastPeriod - 末次月经日期
 * @param {Date|string} targetDate - 目标日期，默认为今天
 * @returns {Object} { weeks, days, totalDays }
 */
export function calculateGestationalAge(lastPeriod, targetDate = new Date()) {
  const start = dayjs(lastPeriod);
  const end = dayjs(targetDate);
  const diffDays = end.diff(start, 'day');
  const weeks = Math.floor(diffDays / 7);
  const days = diffDays % 7;
  return { weeks, days, totalDays: diffDays };
}

/**
 * 计算预产期
 * @param {Date|string} lastPeriod - 末次月经日期
 * @returns {Date} 预产期
 */
export function calculateDueDate(lastPeriod) {
  return dayjs(lastPeriod).add(280, 'day').toDate();
}

/**
 * 格式化日期
 * @param {Date|string} date - 日期
 * @param {string} format - 格式，默认 'YYYY-MM-DD'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  return dayjs(date).format(format);
}

/**
 * 格式化孕周显示
 * @param {number} weeks - 孕周
 * @param {number} days - 天数
 * @returns {string} 例如："12周+3天"
 */
export function formatGestationalAge(weeks, days) {
  if (days === 0) {
    return `${weeks}周`;
  }
  return `${weeks}周+${days}天`;
}
