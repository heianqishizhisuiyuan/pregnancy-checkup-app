import dayjs from 'dayjs';

/**
 * 计算距离下次产检的天数（按自然日，0 表示今天）
 */
export function getDaysUntilNextCheckup(nextCheckupDate, targetDate = new Date()) {
  if (!nextCheckupDate) return null;
  return dayjs(nextCheckupDate).startOf('day').diff(dayjs(targetDate).startOf('day'), 'day');
}

/**
 * 是否处于提醒窗口内（含当天）
 */
export function isInReminderWindow(nextCheckupDate, reminderDaysBefore = 1, targetDate = new Date()) {
  const daysLeft = getDaysUntilNextCheckup(nextCheckupDate, targetDate);
  if (daysLeft === null) return false;
  return daysLeft >= 0 && daysLeft <= reminderDaysBefore;
}

/**
 * 生成首页提醒文案
 */
export function formatCheckupReminderText(nextCheckupDate, targetDate = new Date()) {
  const daysLeft = getDaysUntilNextCheckup(nextCheckupDate, targetDate);
  if (daysLeft === null) return null;

  const dateText = dayjs(nextCheckupDate).format('M月D日');

  if (daysLeft < 0) {
    return { dateText, daysLeft, message: `下次产检 ${dateText}，已过期 ${Math.abs(daysLeft)} 天`, tone: 'overdue' };
  }
  if (daysLeft === 0) {
    return { dateText, daysLeft, message: `今天产检（${dateText}）`, tone: 'today' };
  }
  if (daysLeft === 1) {
    return { dateText, daysLeft, message: `明天产检（${dateText}）`, tone: 'soon' };
  }
  return { dateText, daysLeft, message: `下次产检 ${dateText}，还有 ${daysLeft} 天`, tone: 'normal' };
}
