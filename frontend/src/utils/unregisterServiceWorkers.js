/**
 * 注销已注册的 Service Worker 并清理 Workbox 缓存
 * 用于关闭 PWA 离线缓存后，让已安装旧版 SW 的用户恢复为普通网页行为
 */
export function unregisterServiceWorkers() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });

  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
}
