import { ref, onMounted, onBeforeUnmount } from 'vue';

export function useOfflineStatus() {
  const isOffline = ref(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  const update = () => {
    isOffline.value = !navigator.onLine;
  };

  onMounted(() => {
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
  });

  return { isOffline };
}
