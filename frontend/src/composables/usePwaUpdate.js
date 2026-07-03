import { ref } from 'vue';

/** 是否有新版本待刷新 */
export const pwaNeedRefresh = ref(false);

let refreshing = false;

/**
 * 注册 Service Worker 并监听更新（仅生产环境）
 */
export function initPwaUpdate() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  navigator.serviceWorker.register('/sw.js').then((registration) => {
    // 已有等待中的新版本
    if (registration.waiting && navigator.serviceWorker.controller) {
      pwaNeedRefresh.value = true;
    }

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          pwaNeedRefresh.value = true;
        }
      });
    });

    const checkUpdate = () => registration.update().catch(() => {});
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkUpdate();
      }
    });
    setInterval(checkUpdate, 60 * 60 * 1000);
  }).catch(() => {
    // 离线能力不可用时静默失败
  });
}

/** 应用新版本并刷新页面 */
export function applyPwaUpdate() {
  navigator.serviceWorker.getRegistration().then((registration) => {
    const waiting = registration?.waiting;
    if (!waiting) {
      window.location.reload();
      return;
    }
    waiting.postMessage({ type: 'SKIP_WAITING' });
  });
}
