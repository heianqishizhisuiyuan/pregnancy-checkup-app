import { ref, onMounted, onBeforeUnmount } from 'vue';
import dayjs from 'dayjs';
import { isInReminderWindow, formatCheckupReminderText } from '@/utils/checkupReminder.js';

const NOTIFIED_KEY_PREFIX = 'checkup_reminder_notified_';

function getNotifiedKey(nextCheckupDate) {
  return `${NOTIFIED_KEY_PREFIX}${dayjs(nextCheckupDate).format('YYYY-MM-DD')}`;
}

function wasNotifiedToday(nextCheckupDate) {
  return localStorage.getItem(getNotifiedKey(nextCheckupDate)) === dayjs().format('YYYY-MM-DD');
}

function markNotifiedToday(nextCheckupDate) {
  localStorage.setItem(getNotifiedKey(nextCheckupDate), dayjs().format('YYYY-MM-DD'));
}

/**
 * 产检提醒：浏览器通知权限与本地提醒
 */
export function useCheckupReminder(getReminderConfig) {
  const notificationSupported = typeof window !== 'undefined' && 'Notification' in window;
  const permission = ref(notificationSupported ? Notification.permission : 'denied');

  const requestPermission = async () => {
    if (!notificationSupported) {
      return 'unsupported';
    }
    if (Notification.permission === 'granted') {
      permission.value = 'granted';
      return 'granted';
    }
    if (Notification.permission === 'denied') {
      permission.value = 'denied';
      return 'denied';
    }
    const result = await Notification.requestPermission();
    permission.value = result;
    return result;
  };

  const fireNotification = (nextCheckupDate) => {
    if (!notificationSupported || Notification.permission !== 'granted') return;
    if (wasNotifiedToday(nextCheckupDate)) return;

    const text = formatCheckupReminderText(nextCheckupDate);
    if (!text) return;

    // eslint-disable-next-line no-new
    new Notification('产检提醒', {
      body: text.message,
      icon: '/favicon.svg',
      tag: getNotifiedKey(nextCheckupDate),
    });
    markNotifiedToday(nextCheckupDate);
  };

  const checkAndNotify = () => {
    const config = getReminderConfig();
    if (!config?.nextCheckupDate) return;

    const { nextCheckupDate, reminderDaysBefore = 1 } = config;
    if (!isInReminderWindow(nextCheckupDate, reminderDaysBefore)) return;

    fireNotification(nextCheckupDate);
  };

  let intervalId;

  onMounted(() => {
    checkAndNotify();
    intervalId = window.setInterval(checkAndNotify, 60 * 60 * 1000);
  });

  onBeforeUnmount(() => {
    if (intervalId) window.clearInterval(intervalId);
  });

  return {
    notificationSupported,
    permission,
    requestPermission,
    checkAndNotify,
  };
}
