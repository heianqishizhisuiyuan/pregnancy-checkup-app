import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const DISMISS_KEY = 'pwa_install_dismissed';

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function isIOSDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isAndroidDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

/**
 * PWA 安装引导：Android beforeinstallprompt + iOS 手动说明
 */
export function usePwaInstall() {
  const deferredPrompt = ref(null);
  const dismissed = ref(localStorage.getItem(DISMISS_KEY) === '1');

  const isStandalone = computed(() => isStandaloneMode());
  const isIOS = computed(() => isIOSDevice());
  const isAndroid = computed(() => isAndroidDevice());
  const canNativeInstall = computed(() => !!deferredPrompt.value);

  const shouldShowBanner = computed(() => {
    if (dismissed.value || isStandalone.value) return false;
    if (canNativeInstall.value) return true;
    if (isIOS.value) return true;
    return false;
  });

  const installHint = computed(() => {
    if (canNativeInstall.value) {
      return '安装到主屏幕后，可像 App 一样快速打开';
    }
    if (isIOS.value) {
      return '在 Safari 中点击底部分享按钮，选择「添加到主屏幕」';
    }
    return '在浏览器菜单中选择「添加到主屏幕」或「安装应用」';
  });

  const handleBeforeInstallPrompt = (event) => {
    event.preventDefault();
    deferredPrompt.value = event;
  };

  const promptInstall = async () => {
    if (!deferredPrompt.value) return 'unavailable';

    deferredPrompt.value.prompt();
    const result = await deferredPrompt.value.userChoice;
    deferredPrompt.value = null;

    if (result.outcome === 'accepted') {
      dismissed.value = true;
      localStorage.setItem(DISMISS_KEY, '1');
      return 'accepted';
    }
    return 'dismissed';
  };

  const dismissBanner = () => {
    dismissed.value = true;
    localStorage.setItem(DISMISS_KEY, '1');
  };

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  });

  return {
    shouldShowBanner,
    canNativeInstall,
    isIOS,
    isAndroid,
    isStandalone,
    installHint,
    promptInstall,
    dismissBanner,
  };
}
