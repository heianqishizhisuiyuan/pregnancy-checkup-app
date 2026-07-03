import { ref, onMounted, onBeforeUnmount } from 'vue';

/**
 * 简易下拉刷新（移动端）
 * @param {HTMLElement | null} containerRef
 * @param {() => Promise<void>} onRefresh
 */
export function usePullToRefresh(containerRef, onRefresh) {
  const pulling = ref(false);
  const pullDistance = ref(0);
  const THRESHOLD = 72;

  let startY = 0;
  let active = false;

  const onTouchStart = (e) => {
    const el = containerRef?.value;
    if (!el || el.scrollTop > 0) return;
    startY = e.touches[0].clientY;
    active = true;
  };

  const onTouchMove = (e) => {
    if (!active) return;
    const delta = e.touches[0].clientY - startY;
    if (delta > 0) {
      pullDistance.value = Math.min(delta * 0.5, 100);
      if (pullDistance.value > 10) e.preventDefault();
    }
  };

  const onTouchEnd = async () => {
    if (!active) return;
    active = false;
    if (pullDistance.value >= THRESHOLD) {
      pulling.value = true;
      try {
        await onRefresh();
      } finally {
        pulling.value = false;
      }
    }
    pullDistance.value = 0;
  };

  onMounted(() => {
    const el = containerRef?.value;
    if (!el) return;
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
  });

  onBeforeUnmount(() => {
    const el = containerRef?.value;
    if (!el) return;
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchmove', onTouchMove);
    el.removeEventListener('touchend', onTouchEnd);
  });

  return { pulling, pullDistance };
}
